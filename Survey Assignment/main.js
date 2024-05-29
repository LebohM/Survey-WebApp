function validateContactNumber(contactNumber) {
  var regex = /^(0\d{9}|\+27\d{9})$/;
  return regex.test(contactNumber);
}

function validateDOB(dob) {
  var birthDate = new Date(dob);
  var age = new Date().getFullYear() - birthDate.getFullYear();
  return age >= 5 && age <= 120;
}

function submitForm(event) {
  event.preventDefault();

  var fullName = document.getElementById("full-name").value;
  var email = document.getElementById("email").value;
  var dob = document.getElementById("dob").value;
  var contactNumber = document.getElementById("contact-number").value;

  var isValid = true;

  if (!fullName) {
    alert("Full Name is required");
    isValid = false;
  }

  if (!email) {
    alert("Email is required");
    isValid = false;
  }

  if (!dob || !validateDOB(dob)) {
    document.getElementById("dob-error").style.display = "block";
    isValid = false;
  } else {
    document.getElementById("dob-error").style.display = "none";
  }

  if (!validateContactNumber(contactNumber)) {
    document.getElementById("contact-error").style.display = "block";
    isValid = false;
  } else {
    document.getElementById("contact-error").style.display = "none";
  }

  var favoriteFoods = [];
  document
    .querySelectorAll('input[name="favorite-foods"]:checked')
    .forEach(function (checkbox) {
      favoriteFoods.push(checkbox.value);
    });

  var movies = document.querySelector('input[name="movies"]:checked');
  var radio = document.querySelector('input[name="radio"]:checked');
  var eatOut = document.querySelector('input[name="eat-out"]:checked');
  var tv = document.querySelector('input[name="tv"]:checked');

  if (!movies || !radio || !eatOut || !tv) {
    alert("Please rate all the categories.");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  var newRow = [
    fullName,
    email,
    dob,
    contactNumber,
    favoriteFoods.join(", "),
    movies.value,
    radio.value,
    eatOut.value,
    tv.value,
  ];

  var existingData = localStorage.getItem("excelData");
  var workbook, worksheet, jsonData;

  if (existingData) {
    workbook = XLSX.read(existingData, { type: "base64" });
    worksheet = workbook.Sheets[workbook.SheetNames[0]];
    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    jsonData.push(newRow); // Add new data row
  } else {
    // Create new workbook with headers
    jsonData = [
      [
        "Full Name",
        "Email",
        "Date of Birth",
        "Contact Number",
        "Favorite Foods",
        "Movies",
        "Radio",
        "Eat Out",
        "TV",
      ],
      newRow,
    ];
    worksheet = XLSX.utils.aoa_to_sheet(jsonData);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Survey Data");
  }

  // Update the worksheet with the new data
  worksheet = XLSX.utils.aoa_to_sheet(jsonData);
  workbook.Sheets[workbook.SheetNames[0]] = worksheet;

  // Save the updated workbook to localStorage
  var excelData = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
  localStorage.setItem("excelData", excelData);

  // Trigger download of the updated file
  XLSX.writeFile(workbook, "survey_data.xlsx");
  alert("The form has been submitted successfully");
}

function displayStats() {
  hideForm(); // Hide the form

  var existingData = localStorage.getItem("excelData");
  if (!existingData) {
    alert("No survey data available");
    return;
  }

  var workbook = XLSX.read(existingData, { type: "base64" });
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    alert("No survey data available");
    return;
  }

  var headers = jsonData[0];
  var data = jsonData.slice(1);

  var numSurveys = data.length;
  var ages = data.map(
    (row) => new Date().getFullYear() - new Date(row[2]).getFullYear()
  );
  var averageAge = (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1);
  var oldestAge = Math.max(...ages);
  var youngestAge = Math.min(...ages);

  var foodCounts = { Pizza: 0, Pasta: 0, PapWors: 0 };
  data.forEach((row) => {
    if (row[4].includes("Pizza")) foodCounts.Pizza++;
    if (row[4].includes("Pasta")) foodCounts.Pasta++;
    if (row[4].includes("Pap and Wors")) foodCounts.PapWors++;
  });

  var pizzaPercentage = ((foodCounts.Pizza / numSurveys) * 100).toFixed(1);
  var pastaPercentage = ((foodCounts.Pasta / numSurveys) * 100).toFixed(1);
  var PapWorsPercentage = ((foodCounts.PapWors / numSurveys) * 100).toFixed(1);

  var ratings = { Movies: [], Radio: [], EatOut: [], TV: [] };
  data.forEach((row) => {
    ratings.Movies.push(row[5]);
    ratings.Radio.push(row[6]);
    ratings.EatOut.push(row[7]);
    ratings.TV.push(row[8]);
  });

  var ratingValues = {
    "Strongly Agree": 1,
    Agree: 2,
    Neutral: 3,
    Disagree: 4,
    "Strongly Disagree": 5,
  };

  function averageRating(arr) {
    return (
      arr.reduce((sum, rating) => sum + ratingValues[rating], 0) / arr.length
    ).toFixed(1);
  }

  var averageMovieRating = averageRating(ratings.Movies);
  var averageRadioRating = averageRating(ratings.Radio);
  var averageEatOutRating = averageRating(ratings.EatOut);
  var averageTVRating = averageRating(ratings.TV);

  var stats = `
                <h2>Survey Results</h2>
                <p>Number of Surveys: ${numSurveys}</p>
                <p>Average Age: ${averageAge}</p>
                <p>Oldest person who participated in survey: ${oldestAge}</p>
                <p>Youngest person who participated in survey: ${youngestAge}</p><br>
                <p>Percentage of people who like Pizza: ${pizzaPercentage}%</p>
                <p>Percentage of people who like Pasta: ${pastaPercentage}%</p>
                <p>Percentage of people who like Pap and Wors: ${PapWorsPercentage}%</p><br>
                <p>People who like to watch Movies: ${averageMovieRating}</p>
                <p>People who like to listen to Radio: ${averageRadioRating}</p>
                <p>People who like to Eat Out: ${averageEatOutRating}</p>
                <p>People who like to watch TV : ${averageTVRating}</p>
            `;

  document.getElementById("stats").innerHTML = stats;
}

function hideForm() {
  var surveyForm = document.getElementById("fullForm");
  if (surveyForm.style.display === "none") {
    surveyForm.style.display = "block";
  } else {
    surveyForm.style.display = "none";
  }
}
