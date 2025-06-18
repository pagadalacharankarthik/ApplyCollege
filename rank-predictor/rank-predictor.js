document.addEventListener("DOMContentLoaded", () => {
    const rankForm = document.getElementById("rankForm");
    const resultDiv = document.getElementById("result");
    const rankValue = document.getElementById("rankValue");

    rankForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstYear = parseInt(document.getElementById("firstYear").value);
        const secondYear = parseInt(document.getElementById("secondYear").value);
        const stream = document.getElementById("stream").value;
        const eamcetMarks = parseInt(document.getElementById("estimatedMarks").value);

        // Disqualify if EAMCET marks <= 40
        if (eamcetMarks <= 40) {
            rankValue.innerHTML = "<p class='error'><strong>Disqualified</strong> (EAMCET marks ≤ 40)</p>";
            resultDiv.style.display = "block";
            return;
        }

        // Calculate total intermediate marks (600 = 270 + 330)
        const totalMarks = firstYear + secondYear;
        const interPercentage = (totalMarks / 600) * 25; // 25% weightage
        
        // Calculate EAMCET percentage (out of 160 marks)
        const eamcetPercentage = (eamcetMarks / 160) * 75; // 75% weightage
        
        // Calculate total percentage
        const totalPercentage = interPercentage + eamcetPercentage;

        // Rank estimation logic (simplified)
        let estimatedRank;
        if (totalPercentage >= 90) {
            estimatedRank = "1 - 5,000 (Top Tier)";
        } else if (totalPercentage >= 75) {
            estimatedRank = "5,001 - 15,000 (Good)";
        } else if (totalPercentage >= 60) {
            estimatedRank = "15,001 - 30,000 (Average)";
        } else {
            estimatedRank = "30,001+ (Below Average)";
        }

        // Display result
        rankValue.innerHTML = `
            <p><strong>Total Intermediate Marks:</strong> ${totalMarks}/600</p>
            <p><strong>25% Weightage:</strong> ${interPercentage.toFixed(2)}%</p>
            <p><strong>EAMCET Marks:</strong> ${eamcetMarks}/160</p>
            <p><strong>75% Weightage:</strong> ${eamcetPercentage.toFixed(2)}%</p>
            <p><strong>Total Percentage:</strong> ${totalPercentage.toFixed(2)}%</p>
            <p><strong>2025 Estimated Rank Range:</strong> ${estimatedRank}</p>
        `;
        resultDiv.style.display = "block";

    });

    
});