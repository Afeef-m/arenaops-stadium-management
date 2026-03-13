# Local IIS Deployment Guide — ArenaOps

> **STATUS: DEFERRED** (To be implemented later)

> Complete guide for hosting ArenaOps services on Local IIS (Windows).

---

## Prerequisites

### 1. Enable IIS on Windows

1. Open **Start Menu** → search **"Turn Windows features on or off"**
2. Check these boxes:
   - ☑ **Internet Information Services**
   - ☑ Internet Information Services → World Wide Web Services → Application Development Features → **ASP.NET 4.8**
   - ☑ Internet Information Services → Web Management Tools → **IIS Management Console**
3. Click **OK** and wait for installation to complete

### 2. Install ASP.NET Core Hosting Bundle

> **This is the most important step.** Without it, IIS cannot run .NET 8 apps.

1. Go to: **https://dotnet.microsoft.com/en-us/download/dotnet/8.0**
2. Under **"ASP.NET Core Runtime 8.x.x"** section, find **"Hosting Bundle"** (Windows)
3. Download and run the installer
4. **Restart IIS** after installation:
   ```
   net stop was /y
   net start w3svc
   ```
   Or run in PowerShell as Admin:
   ```powershell
   iisreset
   ```

### 3. Verify Hosting Bundle

Open **Command Prompt** and run:
```
dotnet --info
```
You should see `.NET runtimes installed` including `Microsoft.AspNetCore.App 8.x.x`.

---

## Step-by-Step: Deploy to Local IIS

### Step 1: Publish Both Services

Open **PowerShell** and run:

```powershell
# Publish AuthService
dotnet publish "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND\ArenaOps.AuthService\ArenaOps.AuthService.API\ArenaOps.AuthService.API.csproj" -c Release -o "C:\inetpub\ArenaOps\AuthService"

# Publish CoreService
dotnet publish "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API\ArenaOps.CoreService.API.csproj" -c Release -o "C:\inetpub\ArenaOps\CoreService"
```

> This creates production-ready files in `C:\inetpub\ArenaOps\`.

### Step 2: Open IIS Manager

1. Press **Win + R**, type `inetmgr`, press Enter
2. IIS Manager opens

### Step 3: Create Application Pools

In IIS Manager:

1. Click **Application Pools** in the left panel
2. Click **Add Application Pool...** in the right panel

**AuthService Pool:**
- Name: `ArenaOps-AuthService`
- .NET CLR version: **No Managed Code**
- Managed pipeline mode: **Integrated**
- Click **OK**

**CoreService Pool:**
- Name: `ArenaOps-CoreService`
- .NET CLR version: **No Managed Code**
- Managed pipeline mode: **Integrated**
- Click **OK**

> **Why "No Managed Code"?** ASP.NET Core uses its own runtime via the Hosting Bundle, not the IIS managed pipeline.

### Step 4: Create IIS Sites

**AuthService Site:**

1. Right-click **Sites** → **Add Website...**
2. Fill in:
   - Site name: `ArenaOps-AuthService`
   - Application pool: `ArenaOps-AuthService`
   - Physical path: `C:\inetpub\ArenaOps\AuthService`
   - Binding:
     - Type: `http`
     - Port: `5001`
     - Host name: *(leave empty)*
3. Click **OK**

**CoreService Site:**

1. Right-click **Sites** → **Add Website...**
2. Fill in:
   - Site name: `ArenaOps-CoreService`
   - Application pool: `ArenaOps-CoreService`
   - Physical path: `C:\inetpub\ArenaOps\CoreService`
   - Binding:
     - Type: `http`
     - Port: `5007`
     - Host name: *(leave empty)*
3. Click **OK**

### Step 5: Set Folder Permissions

IIS runs under the `IIS_IUSRS` group. Grant it access:

```powershell
# Run as Administrator
icacls "C:\inetpub\ArenaOps\AuthService" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\ArenaOps\CoreService" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Step 6: Set Environment to Development

By default, IIS runs in **Production** mode. To use Development settings:

1. In IIS Manager, click on your site (e.g., `ArenaOps-AuthService`)
2. Double-click **Configuration Editor**
3. Navigate to: `system.webServer/aspNetCore`
4. Click on `environmentVariables` → **(Collection)** → **...** button
5. Add:
   - Name: `ASPNETCORE_ENVIRONMENT`
   - Value: `Development`
6. Click **OK**, then **Apply** in the Actions panel

Repeat for `ArenaOps-CoreService`.

### Step 7: Start the Sites

1. In IIS Manager, click each site
2. Click **Start** in the right panel (if not already started)

### Step 8: Test

Open your browser:
- **AuthService**: http://localhost:5001 → Should show "ArenaOps AuthService" or Swagger
- **CoreService**: http://localhost:5007 → Should show "ArenaOps CoreService API is running."
- **Health Check**: http://localhost:5007/health → Should show "Healthy" or "Unhealthy" (depends on DB)

---

## Updating After Code Changes

When you make code changes and want to update IIS:

```powershell
# 1. Stop the sites (in IIS Manager or via command)
Stop-WebSite -Name "ArenaOps-AuthService"
Stop-WebSite -Name "ArenaOps-CoreService"

# 2. Re-publish
dotnet publish "BACKEND\ArenaOps.AuthService\ArenaOps.AuthService.API\ArenaOps.AuthService.API.csproj" -c Release -o "C:\inetpub\ArenaOps\AuthService"
dotnet publish "BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API\ArenaOps.CoreService.API.csproj" -c Release -o "C:\inetpub\ArenaOps\CoreService"

# 3. Start the sites
Start-WebSite -Name "ArenaOps-AuthService"
Start-WebSite -Name "ArenaOps-CoreService"
```

---

## Troubleshooting

| Problem | Solution |
| :--- | :--- |
| **502.5 — Process Failure** | Hosting Bundle not installed. Download from dotnet.microsoft.com |
| **500.19 — Config Error** | Check `web.config` exists in the publish folder |
| **Site won't start — port in use** | Stop any `dotnet run` processes using the same port |
| **403 — Forbidden** | Run the `icacls` permission commands from Step 5 |
| **Can't find IIS Manager** | IIS not enabled in Windows Features (Step 1 of Prerequisites) |
| **Health check shows Unhealthy** | DB connection string may be wrong — check `appsettings.Development.json` |

---

## 5. Getting a Permanent URL (Without Ngrok)

If you want a link that never changes, you have two options depending on where you are:

### Option A: Within your Home/Office Wi-Fi (Local Network)
You don't need the internet at all.
1. **Find your Local IP**: Run `ipconfig` in PowerShell. Look for "IPv4 Address" (e.g., `192.168.1.15`).
2. **Use the IP**: Anyone on your Wi-Fi can go to `http://192.168.1.15:5001`.
3. **Make it Permanent**: Go to your Router Settings and set a "DHCP Reservation" for your laptop so the IP never changes.

### Option B: From the Public Internet (True Permanent URL)
This "pokes a hole" in your router to let the world in directly.
1. **Port Forwarding**: In your Router Settings, forward ports **80** and **443** to your laptop's Local IP.
2. **Dynamic DNS (DDNS)**: Since your Home IP changes, use a service like [No-IP](https://www.noip.com/) or [DuckDNS](https://www.duckdns.org/).
   - They give you a link like `arenaops.ddns.net`.
   - You run a small app on your laptop that tells them whenever your IP changes.
3. **Security Warning**: Doing this exposes your computer directly to the internet. Ensure your Windows Firewall is strictly configured.

---

## External Testing with Ngrok (Optional)

To test webhooks or allow external access (mobile devices, teammates) to your local IIS or dev server:

### 1. Configure Ngrok
1. **Ensure ngrok is up to date**:
   ```powershell
   ngrok update
   ```
   (Must be version **3.20.0** or higher for your account).
2. **Get your authtoken**:
   - Go to [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) (Sign up for a free account if you haven't).
   - Copy the "Your Authtoken" string.
2. Ensure `ngrok` is installed: `ngrok --version`
3. Add your token to the local config:
   ```powershell
   ngrok config add-authtoken <your-token>
   ```

### 2. Start Tunnels
Run the provided script from the **root of the project directory** (`ARENAOPS`):
```powershell
# Open terminal in C:\Users\aflah\OneDrive\Desktop\ARENAOPS
.\start-tunnels.ps1
```
This will open three tunnels:
- **Auth Service**: `https://[id].ngrok-free.app` -> `localhost:5001`
- **Core Service**: `https://[id].ngrok-free.app` -> `localhost:5007`
- **Frontend**: `https://[id].ngrok-free.app` -> `localhost:3000`

### 3. Update Redirect URIs (Google OAuth)
If you are testing Google Login via ngrok, add the ngrok frontend URL to your Google Cloud Console:
- Authorized JavaScript origins: `https://[frontend-id].ngrok-free.app`
- Authorized redirect URIs: `https://[frontend-id].ngrok-free.app/auth/callback`

---

## Architecture Summary

```
Browser → http://localhost:5001 → IIS → AuthService (MonsterASP DB: db41261)
Browser → http://localhost:5007 → IIS → CoreService (MonsterASP DB: db41847)
Browser → http://localhost:3000 → Next.js Dev Server (Frontend)
```
