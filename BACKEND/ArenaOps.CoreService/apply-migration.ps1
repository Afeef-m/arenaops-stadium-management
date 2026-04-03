# PowerShell script to apply the EF Core migration
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Try to apply the migration
Write-Host "Applying EF Core migrations..."
dotnet ef database update --startup-project ArenaOps.CoreService.API --force

Write-Host "Migration applied successfully!"

# Verify the Bowls table exists
Write-Host "Verifying Bowls table..."
$ConnectionString = "Server=db41847.public.databaseasp.net; Database=db41847; User Id=db41847; Password=mH_4%2Jd3Ko-; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;"

# Create a SqlConnection and check for Bowls table
$SqlConnection = New-Object System.Data.SqlClient.SqlConnection
$SqlConnection.ConnectionString = $ConnectionString

try {
    $SqlConnection.Open()
    $SqlCmd = $SqlConnection.CreateCommand()
    $SqlCmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Bowls'"
    $Reader = $SqlCmd.ExecuteReader()
    
    if ($Reader.Read()) {
        Write-Host "✓ Bowls table EXISTS in the database!"
    } else {
        Write-Host "✗ Bowls table NOT FOUND in the database"
    }
    
    $Reader.Close()
} catch {
    Write-Host "Error connecting to database: $_"
} finally {
    $SqlConnection.Close()
}
