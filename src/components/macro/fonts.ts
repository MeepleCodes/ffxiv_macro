
export type FontSource = {
	name: string;
	size: string;
	src: string;
	request: string;
}
export const fontSources: FontSource[] = [];
const fontJsonURLs = import.meta.glob('../../res/*-combined.json', {
  query: '?url',
  import: 'default',
});
function toInitialUpperCase(str: string): string {
  if(str.length < 1) return "";
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

for(const module in fontJsonURLs) {
	const m = module.match(/.*\/([^-]+)-([^-]+)[^/]*-combined.json/);
	console.log("Matched", module, "to", m);
	const [name, size] = m === null ?
		[module, "<unknown>"] :
		[
			`${toInitialUpperCase(m[1])} ${m[2]}`,
			m[2]
		];
	fontSources.push({name, size, src: await fontJsonURLs[module]() as string, request: module});
}
console.log("Loaded fontsources: ", fontSources);