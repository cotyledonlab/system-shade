import { readFile, writeFile } from 'node:fs/promises';
const path = 'safari/System Shade/System Shade.xcodeproj/project.pbxproj';
// Apple's packager can derive the host ID from its name despite --bundle-identifier.
const project = await readFile(path, 'utf8');
await writeFile(path, project.replaceAll('com.cotyledonlab.System-Shade', 'com.cotyledonlab.systemshade'));
