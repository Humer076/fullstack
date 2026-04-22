# Create dev users for testing all roles
$users = @(
    @{clerkUserId='local_test_1'; name='Test Student'; email='student@test.local'; role='student'},
    @{clerkUserId='local_trainer_1'; name='Test Trainer'; email='trainer@test.local'; role='trainer'},
    @{clerkUserId='local_institution_1'; name='Test Institution'; email='institution@test.local'; role='institution'},
    @{clerkUserId='local_manager_1'; name='Test Manager'; email='manager@test.local'; role='programme_manager'},
    @{clerkUserId='local_officer_1'; name='Test Officer'; email='officer@test.local'; role='monitoring_officer'}
)

foreach ($user in $users) {
    $body = $user | ConvertTo-Json
    Write-Host "Creating user: $($user.clerkUserId)..."
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/users/sync' -Method Post -ContentType 'application/json' -Body $body
    Write-Host "OK: $($response.user.clerk_user_id)" 
}

Write-Host "Done"
