$ErrorActionPreference = "Stop"

$authUrl = "http://localhost:5001/api/auth/login"
$coreUrl = "http://localhost:5007/api"

# Login as Admin
$body = @{ email = "admin@arenaops.com"; password = "Password123!" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $authUrl -Method Post -Body $body -ContentType "application/json"
$token = $response.data.accessToken
Write-Host "Obtained Token: $token"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# Create a Stadium
$stadiumData = @{
    name = "Event Test Stadium"
    address = "123 Event Ave"
    city = "TestCity"
    state = "TestState"
    country = "TestCountry"
    pincode = "12345"
    latitude = 50.0
    longitude = -50.0
} | ConvertTo-Json

Write-Host "Creating Stadium..."
$stadiumRes = Invoke-RestMethod -Uri "$coreUrl/stadiums" -Method Post -Headers $headers -Body $stadiumData
$stadiumId = $stadiumRes.data.stadiumId
Write-Host "Stadium Created with ID: $stadiumId"

# Approve Stadium (Admin)
Write-Host "Approving Stadium..."
Invoke-RestMethod -Uri "$coreUrl/admin/stadiums/$stadiumId/approve" -Method Patch -Headers $headers

# Create an Event
$eventData = @{
    stadiumId = $stadiumId
    name = "The Great Exhibition"
    description = "Test Event for Swagger Review"
} | ConvertTo-Json

Write-Host "Creating Event..."
$eventRes = Invoke-RestMethod -Uri "$coreUrl/events" -Method Post -Headers $headers -Body $eventData
$eventId = $eventRes.data.eventId
Write-Host "Event Created with ID: $eventId !!"
Write-Host "Final GUID to test: $eventId"
