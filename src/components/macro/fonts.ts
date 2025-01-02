
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
for(const module in fontJsonURLs) {
	const parts = (module.startsWith("./") ? module.substring(2) : module).split(/[-.]/).slice(0,2);
	const name = parts[0].charAt(0).toUpperCase() + parts[0].substring(1) + " " + parts[1];
	const size = parts[1];
	fontSources.push({name, size, src: await fontJsonURLs[module]() as string, request: module});
}