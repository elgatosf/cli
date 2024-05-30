// Statically inline all uses of createRequire
// This is necessary for use in environments where the node_modules directory isn't available at run time.
//
// This script makes a few assumptions about the use of createRequire, such as:
// * createRequire is imported via named import
// * The creation of a createRequire function is done on a single line
// * Use of such functions is done only once on any given line and on a single line

import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import { createFilter } from '@rollup/pluginutils';
import { RollupTypescriptPluginOptions } from '@rollup/plugin-typescript';
import { Plugin } from 'rollup';

function processTS(code : string, nodeDirPath : string){
	let modified = false;
	const lines = code.replace("\r", "").split("\n");

	let result = "";
	const requireRegex : RegExp[] = [];

	for(const rawLine of lines){
		let handled = false;
		const line = rawLine.trim();

		// Detect import of createRequire from node:module
		let matches = line.match(/^import\s*{([\s]*|[^}]*,\s*)createRequire(\s*|,[^}]*)}\s*from\s+['"]node:module['"]\s*;$/);
		if(matches && matches.length >= 3){
			// Splice out the createRequire
			let begin = matches[1].trim();
			let end = matches[2].trim();
			// If the length is more than zero, we definitely have a trailing comma
			if(begin.length > 0){
				begin = begin.substring(0, begin.length - 1);
			}
			// If the length is more than zero, we definitely have a leading comma
			if(end.length > 0){
				end = end.substring(1);
			}
			const comma = begin.length > 0 && end.length > 0 ? ", ": "";
			const imports = begin + comma + end;
			if(imports.length > 0){
				result += `import { ${imports} } from "node:module";\n`;
			}
			handled = true;
		}

		// Detect invocation of createRequire
		matches = line.match(/^(const|let|var)\s+([^\s=]+)\s*=\s*createRequire\s*\(.*/);
		if(matches && matches.length >= 3){
			// Create a regex that detects use of a createRequire function
			requireRegex.push(new RegExp(`(.*[^a-zA-Z])${matches[2].trim()}\\(['"]([^)]+)['"]\\)(.*)`));
			handled = true;
		}

		// Check against all require functions discovered so far
		for( const requireCheck of requireRegex){
			matches = requireCheck.exec(line);
			if( matches && matches.length >= 4){
				// Splice in the fule
				const fileData = fs.readFileSync(nodePath.join(nodeDirPath, matches[2]));

				result += matches[1] + fileData.toString() + matches[3] + "\n";
				handled = true;
				break;
			}
		}

		if(!handled){
			result += rawLine + "\n";
		}
		else {
			modified = true;
		}
	}

	if(modified){
		return result;
	}
	return code;
}



export function inlineRequires(options : RollupTypescriptPluginOptions = {}) : Plugin {
	const filter = createFilter(options.include, options.exclude);

	return {
		name: 'inline-require',
		transform(code : string, id : string) : string | undefined {
			if (!filter(id)) return;

			return processTS(code, "node_modules");
		}
	};
}
