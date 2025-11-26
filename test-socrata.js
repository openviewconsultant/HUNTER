const SOCRATA_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";

async function testSocrata() {
    try {
        const query = "OBRA CIVIL";
        console.log("\nTesting with 'q' parameter...");
        const url3 = new URL(SOCRATA_API_URL);
        url3.searchParams.append("$limit", "1");
        url3.searchParams.append("$q", query);

        console.log("Query URL:", url3.toString());
        const response3 = await fetch(url3.toString());
        const data3 = await response3.json();

        if (Array.isArray(data3) && data3.length > 0) {
            console.log("Full record:", JSON.stringify(data3[0], null, 2));
        } else {
            console.log("No data found or error:", JSON.stringify(data3, null, 2));
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testSocrata();
