import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const colorMap = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30',
    text: 'text-blue-200',
    iconBg: 'bg-blue-500/30 text-blue-300'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30',
    text: 'text-red-200',
    iconBg: 'bg-red-500/30 text-red-300'
  },
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30',
    text: 'text-cyan-200',
    iconBg: 'bg-cyan-500/30 text-cyan-300'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30',
    text: 'text-green-200',
    iconBg: 'bg-green-500/30 text-green-300'
  },
  gray: {
    bg: 'bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-slate-700/30',
    text: 'text-muted-foreground',
    iconBg: 'bg-slate-700/30 text-muted-foreground'
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
