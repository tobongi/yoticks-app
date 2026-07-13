import { Circle, Path, Rect, Svg, type SvgProps } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
} & SvgProps;

function Icon({
  size = 24,
  color = '#F6F7FA',
  strokeWidth = 1.8,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Circle cx="11" cy="11" r="6.25" />
      <Path d="M16.2 16.2 20 20" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Rect x="4" y="5" width="16" height="15" rx="3" />
      <Path d="M8 3.5V7M16 3.5V7M4 9h16" />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M12 21s5-4.1 5-9a5 5 0 1 0-10 0c0 4.9 5 9 5 9Z" />
      <Circle cx="12" cy="12" r="2.2" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
    </Icon>
  );
}

export function RingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Circle cx="12" cy="12" r="6.5" />
      <Circle cx="12" cy="12" r="2.5" />
    </Icon>
  );
}

export function DiamondIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M12 3.8 20.2 12 12 20.2 3.8 12Z" />
    </Icon>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M4 6.5 9 5l6 2 5-1.5v12L15 19l-6-2-5 1.5Z" />
      <Path d="M9 5v12M15 7v12" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 4V16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3.5a2 2 0 0 0 0-4Z" />
      <Path d="M10.5 7v10" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Circle cx="12" cy="8.5" r="3.25" />
      <Path d="M5.5 19c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5" />
    </Icon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Rect x="7" y="4.5" width="10" height="15" rx="2" />
      <Path d="M9 4.5h6a1 1 0 0 1 1 1V7H8V5.5a1 1 0 0 1 1-1Z" />
      <Path d="M9 11h6M9 14h6" />
    </Icon>
  );
}

export function TentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="m4.5 18 7.5-11 7.5 11" />
      <Path d="M8 18v-4h8v4" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M12 20a2.3 2.3 0 0 0 2.2-1.7H9.8A2.3 2.3 0 0 0 12 20Z" />
      <Path d="M18 16H6c1.2-1.4 1.8-2.7 1.8-5.6A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 4.2 4.4c0 2.9.6 4.2 1.8 5.6Z" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M5 6.5h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-4.5 3v-3H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M12 10.5v5M12 7.5h.01" />
    </Icon>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M4 14.5c1.7-2.8 3.3-2.8 5 0s3.3 2.8 5 0 3.3-2.8 5 0" />
      <Path d="M4.5 10.5c1.2-1.7 2.5-1.7 3.7 0" />
    </Icon>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M12.5 4.5c1 2.2.8 3.7-.4 5.1-1.1 1.2-1.5 2.2-1.1 3.4.5 1.6 1.8 2.5 3.5 2.5 2.5 0 4.2-1.8 4.2-4.4 0-2.7-1.2-4.8-3.2-7.1-.2 1.2-.8 1.7-1.7 2.2.1-1.2-.3-2.5-1.3-3.7-1.7 1.2-3.9 3.9-4.9 6.1-.8 1.7-.8 3.3.2 4.9" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M14.5 6 8.5 12l6 6" />
      <Path d="M8.5 12h11" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M7 7 17 17M17 7 7 17" />
    </Icon>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Rect x="4" y="4" width="5" height="5" rx="1" />
      <Rect x="15" y="4" width="5" height="5" rx="1" />
      <Rect x="4" y="15" width="5" height="5" rx="1" />
      <Rect x="11" y="11" width="2" height="2" rx="0.5" />
      <Rect x="15" y="15" width="2" height="2" rx="0.5" />
      <Rect x="18" y="12" width="2" height="2" rx="0.5" />
    </Icon>
  );
}
