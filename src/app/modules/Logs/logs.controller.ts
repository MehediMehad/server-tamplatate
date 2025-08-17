import { Request, Response } from "express";
import httpStatus from "http-status";
import { LogsService } from "./logs.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";

const getErrorLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await LogsService.getErrorLogs();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Error logs retrieved successfully",
    data: logs,
  });
});

const renderErrorLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await LogsService.getErrorLogs();
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Error Logs</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          pre {
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h1>Error Logs</h1>
        <table id="logsTable">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Message</th>
              <th>Status Code</th>
              <th>Path</th>
              <th>Method</th>
              <th>Stack</th>
            </tr>
          </thead>
          <tbody id="logsBody"></tbody>
        </table>

        <script>
          fetch("/api/v1/logs/errors", {
            method: "GET",
            headers: {
              Authorization: "Bearer " + 
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTAzNjc4ZGNmZmQ5MmYyNTk2NjIyMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJpYXQiOjE3NTU0MTQxOTEsImV4cCI6MTc1ODAwNjE5MX0.Mh8R6_85qaCvPJfX-ekqVdELQUCKZhnim1plLTvXkuA" // replace with valid token
            }
          })
            .then(response => response.json())
            .then(data => {
              const tbody = document.getElementById("logsBody");
              if (data.success && data.data) {
                data.data.forEach(log => {
                  const row = document.createElement("tr");
                  row.innerHTML = \`
                    <td>\${log.timestamp || "N/A"}</td>
                    <td>\${log.message || "N/A"}</td>
                    <td>\${log.statusCode || "N/A"}</td>
                    <td>\${log.path || "N/A"}</td>
                    <td>\${log.method || "N/A"}</td>
                    <td><pre>\${log.stack || "N/A"}</pre></td>
                  \`;
                  tbody.appendChild(row);
                });
              } else {
                tbody.innerHTML = '<tr><td colspan="6">' + data.message + '</td></tr>';
              }
            })
            .catch(error => {
              document.getElementById("logsBody").innerHTML =
                '<tr><td colspan="6">Error fetching logs: ' + error.message + '</td></tr>';
            });
        </script>
      </body>
    </html>
  `);
});

export const LogsController = {
  getErrorLogs,
  renderErrorLogs,
};
