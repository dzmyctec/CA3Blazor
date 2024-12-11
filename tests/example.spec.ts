import { test, expect } from '@playwright/test';






test('Top Scorers button fetches and displays data', async ({ page }) => {
    // Navigate to the Blazor app
    await page.goto('http://localhost:5273'); // Adjusted to correct URL

    // Verify that the "Top Scorers" button exists
    const topScorersButton = page.locator('button:has-text("Top Scorers")');
    await expect(topScorersButton).toBeVisible();

    // Optionally, wait for an API response (if applicable)
    // Wait for API response with an updated timeout
    await page.waitForResponse(response =>
        response.url().includes('topscorers') && response.status() === 200,
        { timeout: 60000 } // Increase timeout to 60 seconds
    );

    // Increase timeout for waiting for the table
    await page.waitForSelector('table.table', { timeout: 60000 }); // 60 seconds

    // Verify that the table contains data (at least 1 row)
    const rows = page.locator('table.table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0); // Expect at least one row

    // Verify that the first row contains valid data (adjust column checks as necessary)
    const firstRow = rows.first();
    const playerName = firstRow.locator('td:nth-child(3) strong');
    await expect(playerName).toHaveText(/.+/); // Ensure player name is not empty

    const goals = firstRow.locator('td:nth-child(4)');
    await expect(goals).toHaveText(/\d+/); // Ensure goals is a number
});







test('Toggling between Top Scorers and Top Assists updates the table', async ({ page }) => {
    await page.goto('http://localhost:5273');

    // Verify that the "Top Scorers" button is active initially
    const topScorersButton = page.locator('button:has-text("Top Scorers")');
    await expect(topScorersButton).toHaveClass(/active/);

    // Click the "Top Assists" button
    const topAssistsButton = page.locator('button:has-text("Top Assists")');
    await topAssistsButton.click();

    // Verify that the "Top Assists" button is active now
    await expect(topAssistsButton).toHaveClass(/active/);

    // Check that the correct data is displayed (e.g., assists vs. goals)
    const firstRow = page.locator('table.table tbody tr:first-child');
    const assists = firstRow.locator('td:nth-child(4)');
    await expect(assists).toHaveText(/\d+/);  // Check for assists value

    // Click back to "Top Scorers"
    await topScorersButton.click();

    // Verify that the first row now shows goals
    const goals = firstRow.locator('td:nth-child(4)');
    await expect(goals).toHaveText(/\d+/);  // Check for goals value
});







test('League dropdown changes data correctly', async ({ page }) => {
    await page.goto('http://localhost:5273');

    const leagueSelect = page.locator('select#leagueSelect');
    await leagueSelect.selectOption({ label: 'La Liga' }); // Example: select La Liga

    // Wait for the table to update after selecting a league
    await page.waitForSelector('table.table tbody tr:first-child', { timeout: 10000 }); // Wait for first row to appear

    // Verify if the displayed data has changed (e.g., check first row)
    const firstRow = page.locator('table.table tbody tr:first-child');
    const playerName = firstRow.locator('td:nth-child(3) strong');

    // Add a timeout to ensure we have enough time for the data to load
    await expect(playerName).toHaveText(/.+/, { timeout: 10000 }); // Ensure player name is visible

    // Optionally, you can log the table content for debugging
    const tableContent = await page.locator('table.table').textContent();
    console.log(tableContent); // For debugging the table content
});








// Additional Test for Button State Toggling
test('Button state toggles correctly', async ({ page }) => {
    await page.goto('http://localhost:5273');

    const topScorersButton = page.locator('button:has-text("Top Scorers")');
    const topAssistsButton = page.locator('button:has-text("Top Assists")');

    // Verify that Top Scorers button is active initially
    await expect(topScorersButton).toHaveClass(/active/);

    // Click on Top Assists and verify its state
    await topAssistsButton.click();
    await expect(topAssistsButton).toHaveClass(/active/);
    await expect(topScorersButton).not.toHaveClass(/active/);
});

// Additional Test for Empty Data State
test('Displays "No data available" when there is no data', async ({ page }) => {
    await page.goto('http://localhost:5273');

    // Simulate no data scenario (you can mock the API to return empty data for testing)
    const noDataMessage = page.locator('p');
    await expect(noDataMessage).toHaveText('No data available');
});







test('Goal conversion rate calculation', async ({ page }) => {
    await page.goto('http://localhost:5273');

    // Wait for the table to be populated
    await page.waitForSelector('table.table tbody tr:first-child');

    // Get the first row (or any row to check the calculation)
    const firstRow = page.locator('table.table tbody tr:first-child');


    const playerName = firstRow.locator('td:nth-child(3) strong');
    const shots = await firstRow.locator('td:nth-child(9)').textContent(); // Assuming column 9 is "Shots"
    const goals = await firstRow.locator('td:nth-child(4)').textContent(); // Assuming column 4 is "Goals"
    const goalConversionRate = await firstRow.locator('td:nth-child(10)').textContent(); // Assuming column 10 is "Goal Conversion Rate"

    // Convert the text content to numbers
    const goalsNum = parseFloat(goals || '0');
    const shotsNum = parseFloat(shots || '0');
    const expectedGoalConversionRate = shotsNum > 0 ? (goalsNum / shotsNum) * 100 : 0;

    // Log for debugging
    console.log(`Player: ${await playerName.textContent()}`);
    console.log(`Goals: ${goalsNum}, Shots: ${shotsNum}`);
    console.log(`Expected Goal Conversion Rate: ${expectedGoalConversionRate}`);

    // Verify the calculation
    await expect(parseFloat(goalConversionRate || '0')).toBeCloseTo(expectedGoalConversionRate, 2); // Allow some floating point precision
});




test('Verify Salah goals per 90 calculation', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:5273'); // Replace with your actual URL

 
    await page.waitForSelector('#leagueSelect');

    // Select the Premier League (assuming Premier League has ID 39)
    await page.selectOption('#leagueSelect', { value: '39' });

    // Wait for the data to load after selecting the league
    await page.waitForSelector('table.table tbody tr');

    // Locate Salah in the table (assumes Salah's name is present)
    const salahRow = await page.locator('table.table tbody tr', { hasText: 'Mohamed Salah' });

    // Get Salah's goals, appearances, and minutes played from the table
    const goals = await salahRow.locator('td:nth-child(4)').textContent(); // Assuming Goals are in the 4th column
    const appearances = await salahRow.locator('td:nth-child(6)').textContent(); // Assuming Appearances are in the 6th column
    const goalsPer90 = await salahRow.locator('td:nth-child(7)').textContent(); // Assuming Goals per 90 are in the 7th column

    // Convert to numbers
    const goalsNum = parseFloat(goals || '0');
    const appearancesNum = parseInt(appearances || '0', 10);

    // Calculate expected goals per 90 (assuming 90 minutes per game)
    const minutesPerGame = appearancesNum * 90;
    const expectedGoalsPer90 = (goalsNum / minutesPerGame) * 90;

    // Debugging logs (can be removed later)
    console.log(`Goals: ${goalsNum}, Appearances: ${appearancesNum}`);
    console.log(`Expected Goals per 90: ${expectedGoalsPer90}`);
    console.log(`Received Goals per 90: ${goalsPer90}`);

    // Assert that the calculated goals per 90 is close to the expected value (0.66)
    await expect(parseFloat(goalsPer90 || '0')).toBeCloseTo(expectedGoalsPer90, 2);
});


test('Verify league selection and table data load', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:5273/Counter'); // Adjust to your app's URL

    // Wait for the dropdown to be visible
    await page.waitForSelector('#leagueSelect');

    // Select the "La Liga" league (Id 140)
    await page.selectOption('#leagueSelect', { value: '140' });

    // Wait for the table to reload with data
    await page.waitForSelector('table.table tbody tr');

    // Verify that the first row in the table contains data
    const firstTeamRow = await page.locator('table.table tbody tr:first-child');

    // Get the name and points of the first team
    const firstTeamName = await firstTeamRow.locator('td:nth-child(2)').textContent();
    const firstTeamPoints = await firstTeamRow.locator('td:nth-child(3)').textContent();

    console.log(`First team in La Liga: ${firstTeamName}`);
    console.log(`First team points: ${firstTeamPoints}`);

    // Assert that the name is visible and points are a valid number
    expect(firstTeamName).not.toBeNull();
    expect(firstTeamName?.trim()).not.toBe(""); // Ensure name is not empty
    expect(firstTeamPoints).not.toBeNull();
    expect(Number(firstTeamPoints)).toBeGreaterThanOrEqual(0); // Points should be a non-negative number
});
