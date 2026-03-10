import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CalendarDays, Users, Ticket } from "lucide-react"

export default function ManagerDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of stadium activity
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Total Stadiums
            </CardTitle>
            <Building2 size={18} />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Today{"'"}s Bookings
            </CardTitle>
            <CalendarDays size={18} />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users size={18} />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">154</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Tickets Sold
            </CardTitle>
            <Ticket size={18} />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">432</div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}