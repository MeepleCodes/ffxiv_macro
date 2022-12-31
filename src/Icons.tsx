import { ReactComponent as Icon } from './icon.svg';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export function THRMIcon(props: SvgIconProps) {
	return (
		<SvgIcon component={Icon} {...props} inheritViewBox />
	);
}