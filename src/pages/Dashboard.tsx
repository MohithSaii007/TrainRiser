import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Train, Ticket, TrendingUp, Activity } from 'lucide-react';

const mockData = [
  { name: 'S1', occupancy: 85 },
  { name: 'S2', occupancy: 92 },
  { name: 'B1', occupancy: 45 },
  { name: 'B2', occupancy: 30 },
  { name: 'A1', occupancy: 15 },
  { name: 'H1', occupancy: 10 },
];

const trendData = [
  { time: '08:00', bookings: 120 },
  { time: '10:00', bookings: 450 },
  { time: '12:00', bookings: 300 },
  { time: '14:00', bookings: 600 },
  { time: '16:00', bookings: 800 },
  { time: '18:00', bookings: 550 },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-primary">Live Analytics</h1>
            <p className="text-muted-foreground">Real-time train utilization and booking intelligence</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold animate-pulse">
            <Activity className="w-4 h-4" />
            LIVE UPDATING
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Active Bookings', value: '1,284', icon: Ticket, color: 'text-blue-500' },
            { label: 'Avg. Occupancy', value: '64%', icon: Users, color: 'text-green-500' },
            { label: 'Trains Running', value: '42', icon: Train, color: 'text-purple-500' },
            { label: 'Revenue Growth', value: '+12.5%', icon: TrendingUp, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                  </div>
                  <div className={cn("p-3 rounded-xl bg-background/50", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="text-xl font-black">Coach-wise Occupancy</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="text-xl font-black">Booking Velocity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;