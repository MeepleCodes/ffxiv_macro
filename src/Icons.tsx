import { ReactComponent as Icon } from './icon.svg';
import { SvgIconProps } from '@mui/material/SvgIcon';

import { SvgIcon } from '@mui/material';

export function THRMIcon(props: SvgIconProps) {
	return (
		<SvgIcon component={Icon} {...props} inheritViewBox />
	);
}