import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const colorMap = {
  blue: {
    bg: 'bg-info-muted border border-info',
    text: 'text-info-foreground',
    iconBg: 'bg-info-muted text-info-foreground'
  },
  red: {
    bg: 'bg-danger-muted border border-danger',
    text: 'text-destructive-foreground',
    iconBg: 'bg-danger-muted text-danger-foreground'
  },
  cyan: {
    bg: 'bg-info-muted border border-info',
    text: 'text-info-foreground',
    iconBg: 'bg-info-muted text-info-foreground'
  },
  green: {
    bg: 'bg-success-muted border border-success',
    text: 'text-success-foreground',
    iconBg: 'bg-success-muted text-success-foreground'
  },
  gray: {
    bg: 'bg-card border border-border',
    text: 'text-muted-foreground',
    iconBg: 'bg-muted/20 text-muted-foreground'
  }
};

const StatCard = ({ title, value, icon, color = 'gray' }) => {
  const c = colorMap[color] || colorMap.gray;
  return (
    <Card className={`p-6 ${c.bg} transform transition hover:scale-105 hover:shadow-lg`}> 
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${c.text}`}>{title}</CardTitle>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
