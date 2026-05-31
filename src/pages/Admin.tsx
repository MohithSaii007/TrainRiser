import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Train, Ticket, TrendingUp, Activity, ShieldAlert } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const Admin = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    avgOccupancy: 0,
    activeTrains: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      let revenue = 0;
      bookingsSnap.forEach(doc => revenue += doc.data().totalFare || 0);
      
      setStats({
        totalBookings: bookingsSnap.size,
        totalRevenue: revenue,
        avgOccupancy: 68,
        activeTrains: 42
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-primary">Admin Control Center</h1>
            <p className="text-muted-foreground">Production-grade railway inventory & revenue management</p>
          </div>
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 px-4 py-2">
            <ShieldAlert className="w-4 h-4 mr-2" />
            ADMIN ACCESS
          </Badge>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, color: 'text-blue-500' },
            { label: 'Avg. Occupancy', value: `${stats.avgOccupancy}%`, icon: Users, color: 'text-purple-500' },
            { label: 'Active Trains', value: stats.activeTrains, icon: Train, color: 'text-orange-500' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">{stat.label}</p>
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
            <CardHeader><CardTitle className="text-xl font-black">Coach Utilization Heatmap</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'S1', occupancy: 95 }, { name: 'S2', occupancy: 82 },
                  { name: 'B1', occupancy: 45 }, { name: 'A1', occupancy: 30 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none' }} />
                  <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader><CardTitle className="text-xl font-black">Booking Distribution</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'Confirmed', value: 75 }, { name: 'RAC', value: 15 }, { name: 'Waitlist', value: 10 }
                  ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;