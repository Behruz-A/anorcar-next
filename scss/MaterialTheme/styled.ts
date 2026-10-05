import { styled, alpha, Theme } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import MuiAppBar from '@mui/material/AppBar';
import TextField from '@mui/material/TextField';
import MuiDrawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Switch, { SwitchProps } from '@mui/material/Switch';

export const RippleBadge = styled(Badge)(({ theme }) => ({
	'& .MuiBadge-badge': {
		backgroundColor: '#b4dcff8f',
		color: '#2c40bdd6',
		boxShadow: `0`,
		'&::after': {
			position: 'absolute',
			top: '0px',
			left: '0px',
			width: '100%',
			height: '100%',
			borderRadius: '50%',
			animation: 'ripple 1.2s infinite ease-in-out',
			border: '2px solid #32c2c1',
			content: '""',
		},
	},
	'@keyframes ripple': {
		'0%': {
			transform: 'scale(.8)',
			opacity: 1,
		},
		'100%': {
			transform: 'scale(2.4)',
			opacity: 0,
		},
	},
}));

// IOS SWITCH
export const IOSSwitch = styled(Switch)(({ theme }) => ({
	width: 42,
	height: 26,
	padding: 0,
	fontSize: 12,
	'& .MuiSwitch-switchBase': {
		padding: 0,
		margin: 2,
		transitionDuration: '200ms',
		'&.Mui-checked': {
			transform: 'translateX(16px)',
			color: '#fff',
			'& + .MuiSwitch-track': {
				backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#E92C28',
				opacity: 1,
				border: 0,
			},
			'&.Mui-disabled + .MuiSwitch-track': {
				opacity: 0.5,
			},
		},
		'&.Mui-focusVisible .MuiSwitch-thumb': {
			color: '#33cf4d',
			border: '6px solid #fff',
		},
		'&.Mui-disabled .MuiSwitch-thumb': {
			color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
		},
		'&.Mui-disabled + .MuiSwitch-track': {
			opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
		},
	},
	'& .MuiSwitch-thumb': {
		boxSizing: 'border-box',
		width: 22,
		height: 22,
	},
	'& .MuiSwitch-track': {
		borderRadius: 26 / 2,
		backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
		opacity: 1,
		transition: theme.transitions.create(['background-color'], {
			duration: 500,
		}),
	},
	'&.MuiFormControlLabel-label': {
		fontSize: 12,
	},
}));

// TEXT FIELD STYLE
export const RedditTextField = styled(TextField)(({ theme }) => ({
	'& .MuiFilledInput-root': {
		border: '1px solid #eee',
		overflow: 'hidden',
		borderRadius: 4,
		backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#fff',
		transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
		'&:hover': {
			backgroundColor: 'transparent',
		},
		'&.Mui-focused': {
			backgroundColor: 'transparent',
			boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 2px`,
			borderColor: theme.palette.primary.main,
		},
	},
}));

// TEXT FIELD STYLE
export const StyleButton = styled(Button)(({ theme }) => ({
	'& .Button-root': {
		border: '1px solid #eee',
		overflow: 'hidden',
		backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#fff',
		transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
		'&:hover': {
			backgroundColor: 'transparent',
		},
	},
}));

////////////////////////////
// ADMIN LAYOUT
////////////////////////////
const openedMixin = (theme: Theme, drawerwidth: number) => ({
	width: drawerwidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: 'hidden',
});

const closedMixin = (theme: Theme) => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up('sm')]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

export const AdminAppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== 'open',
	// @ts-ignore
})(({ theme, open, drawerwidth }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(['width', 'margin'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	...(open && {
		marginLeft: drawerwidth,
		width: `calc(100% - ${drawerwidth}px)`,
		transition: theme.transitions.create(['width', 'margin'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	}),
}));

export const AdminDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
	// @ts-ignore
	({ theme, open, drawerwidth }) => ({
		width: drawerwidth + 'px',
		flexShrink: 0,
		whiteSpace: 'nowrap',
		boxSizing: 'border-box',
		...(open && {
			...openedMixin(theme, drawerwidth),
			'& .MuiDrawer-paper': openedMixin(theme, drawerwidth),
		}),
		...(!open && {
			...closedMixin(theme),
			'& .MuiDrawer-paper': closedMixin(theme),
		}),
	}),
);
