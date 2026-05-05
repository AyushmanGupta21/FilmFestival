// ============================================
// CONFIGURATION - Matched to your Google Sheet columns
// ============================================
const COLUMN_MAPPING = {
  TIMESTAMP: 0,          // Column A - Timestamp
  EMAIL_ADDRESS: 1,      // Column B - Email Address
  NAME: 2,               // Column C - Name
  EMAIL: 3,              // Column D - Email
  DEPARTMENT: 4,         // Column E - Department
  STUDENT_ID: 5,         // Column F - Student ID
  WHATSAPP_NUMBER: 6,    // Column G - Whatsapp Number
  WHICH_COLLEGE: 7,      // Column H - Which College?
  ATTENDANCE: 8,         // Column I - Attendance
  ATTENDED_AT: 9         // Column J - Attended At (timestamp)
};

// ============================================
// FORM SUBMISSION TRIGGER
// This function sends QR codes via email when a student registers
// ============================================
function onFormSubmit(e) {
  try {
    // Get the data the student just submitted
    var name = e.namedValues['Name'] ? e.namedValues['Name'][0] : 'Student';
    var email = e.namedValues['Email'] ? e.namedValues['Email'][0] : '';
    var studentId = e.namedValues['Student ID'] ? e.namedValues['Student ID'][0] : '';
    
    if (email === '' || studentId === '') {
      Logger.log('Missing email or student ID');
      return;
    }

    // Generate the QR Code URL using QuickChart API
    var qrCodeUrl = "https://quickchart.io/qr?size=250&text=" + encodeURIComponent(studentId);

    // Fetch the QR code image
    var qrBlob = UrlFetchApp.fetch(qrCodeUrl).getBlob().setName("qrCodeImage");

    // Create the HTML email body
    var emailBody = "<h2>Hello " + name + ",</h2>" +
                    "<p>Thank you for registering for the Film Festival 2026!</p>" +
                    "<p>Here is your unique entry pass. Please show this QR code to the security guard at the gate:</p>" +
                    "<div style='text-align: center; margin: 20px;'>" +
                      "<img src='cid:qrImage' style='width: 250px; height: 250px;' alt='Your QR Code'>" +
                    "</div>" +
                    "<p><strong>Your Student ID:</strong> " + studentId + "</p>" +
                    "<p>Enjoy the festival!</p>";

    // Send the email with embedded QR code
    MailApp.sendEmail({
      to: email,
      subject: "Your Film Festival 2026 Entry Pass",
      htmlBody: emailBody,
      inlineImages: {
        qrImage: qrBlob
      }
    });
    
    Logger.log('QR code sent successfully to: ' + email);
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
  }
}

// ============================================
// WEB APP ENDPOINTS
// These functions handle the scanner interface
// ============================================

/**
 * Main entry point for GET requests to the web app
 */
function doGet(e) {
  try {
    // Handle different actions
    var action = e.parameter.action;
    var id = e.parameter.id;

    // Status check endpoint
    if (action === 'status') {
      return jsonResponse({
        status: 'ok',
        message: 'Film Festival API is running.'
      });
    }

    // Scan/attendance marking endpoint
    if (action === 'scan' && id) {
      return markAttendance(id);
    }

    // Default: Serve the scanner HTML interface
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Film Festival 2026 - Gate Scanner')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: 'Server error: ' + error.toString()
    }, 500);
  }
}

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mark attendance for a student by their ID
 */
function markAttendance(studentId) {
  try {
    // Get the active spreadsheet and sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses 1');
    
    if (!sheet) {
      return jsonResponse({
        status: 'error',
        message: 'Could not find sheet "Form Responses 1"'
      }, 500);
    }

    // Use LockService to prevent concurrent access issues
    var lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(10000); // Wait up to 10 seconds for the lock
    } catch (lockError) {
      return jsonResponse({
        status: 'error',
        message: 'System is busy. Please try again.'
      }, 503);
    }

    try {
      var data = sheet.getDataRange().getValues();
      var studentIdCol = COLUMN_MAPPING.STUDENT_ID;
      var attendanceCol = COLUMN_MAPPING.ATTENDANCE;
      var attendedAtCol = COLUMN_MAPPING.ATTENDED_AT;
      
      // Search for the student (skip header row)
      for (var i = 1; i < data.length; i++) {
        var rowStudentId = String(data[i][studentIdCol]).trim();
        
        if (rowStudentId === String(studentId).trim()) {
          var rowNumber = i + 1;
          var name = data[i][COLUMN_MAPPING.NAME];
          var department = data[i][COLUMN_MAPPING.DEPARTMENT];
          var whichCollege = data[i][COLUMN_MAPPING.WHICH_COLLEGE];
          var hasAttended = data[i][attendanceCol];
          
          // Check if already attended
          if (hasAttended === 'Yes') {
            return jsonResponse({
              status: 'duplicate',
              message: 'Student has already been admitted.',
              name: name,
              studentId: studentId,
              department: department,
              college: whichCollege
            });
          }
          
          // Mark attendance
          sheet.getRange(rowNumber, attendanceCol + 1).setValue('Yes');
          sheet.getRange(rowNumber, attendedAtCol + 1).setValue(new Date());
          
          return jsonResponse({
            status: 'success',
            message: 'Student admitted successfully!',
            name: name,
            studentId: studentId,
            department: department,
            college: whichCollege
          });
        }
      }
      
      // Student not found
      return jsonResponse({
        status: 'not_found',
        message: 'Student ID not found in the database.',
        studentId: studentId
      });
      
    } finally {
      // Always release the lock
      lock.releaseLock();
    }
    
  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: 'Database error: ' + error.toString()
    }, 500);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test function to verify the script is working
 * Run this from the Script Editor to test
 */
function testMarkAttendance() {
  var result = markAttendance('TEST123');
  Logger.log(result.getContent());
}

/**
 * Get all registered students (for debugging)
 */
function getAllStudents() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses 1');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    Logger.log('Student ID: ' + data[i][COLUMN_MAPPING.STUDENT_ID] + 
               ', Name: ' + data[i][COLUMN_MAPPING.NAME] +
               ', Attendance: ' + data[i][COLUMN_MAPPING.ATTENDANCE]);
  }
}
