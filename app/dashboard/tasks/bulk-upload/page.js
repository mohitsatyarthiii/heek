"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Upload,  Download, X, FileSpreadsheetIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Papa from "papaparse";

export default function BulkUploadTasks() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);

  // Download template CSV
  const downloadTemplate = () => {
    const headers = ["title", "description", "status", "due_date", "assigned_to_email", "creator_name"];
    const sampleData = [
      ["Design Homepage", "Create responsive homepage design", "todo", "2024-12-31", "john@example.com", "Rajesh Kumar"],
      ["Fix Login Bug", "Fix authentication issue on mobile", "in_progress", "2024-12-25", "jane@example.com", "Priya Sharma"]
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task_template.csv";
    a.click();
  };

  // Handle CSV upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data } = results;
        
        // Validate and map data
        const validatedTasks = [];
        const validationErrors = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowErrors = [];

          // Required field validation
          if (!row.title) rowErrors.push("Title is required");
          if (!row.assigned_to_email) rowErrors.push("Assignee email is required");

          // Status validation
          const validStatuses = ["todo", "in_progress", "blocked", "done"];
          if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
            rowErrors.push(`Invalid status. Use: ${validStatuses.join(", ")}`);
          }

          // Date validation
          if (row.due_date) {
            const date = new Date(row.due_date);
            if (isNaN(date.getTime())) {
              rowErrors.push("Invalid date format. Use YYYY-MM-DD");
            }
          }

          if (rowErrors.length > 0) {
            validationErrors.push({
              row: i + 2, // +2 for header row and 1-index
              errors: rowErrors,
              data: row
            });
          } else {
            validatedTasks.push({
              title: row.title || "",
              description: row.description || "",
              status: row.status?.toLowerCase() || "todo",
              due_date: row.due_date || null,
              assigned_to_email: row.assigned_to_email || "",
              creator_name: row.creator_name || null
            });
          }
        }

        setPreviewData(validatedTasks);
        setErrors(validationErrors);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert("Error parsing CSV file");
      }
    });
  };

  // Submit bulk tasks
  const handleBulkSubmit = async () => {
    if (previewData.length === 0) return;
    
    setLoading(true);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication failed");
      }

      // Fetch users and creators for mapping
      const [usersResponse, creatorsResponse] = await Promise.all([
        supabase.from('profiles').select('id, email'),
        supabase.from('creators').select('id, name')
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (creatorsResponse.error) throw creatorsResponse.error;

      const usersMap = new Map();
      const creatorsMap = new Map();
      
      if (usersResponse.data) {
        usersResponse.data.forEach(u => {
          usersMap.set(u.email.toLowerCase(), u.id);
        });
      }
      
      if (creatorsResponse.data) {
        creatorsResponse.data.forEach(c => {
          creatorsMap.set(c.name.toLowerCase(), c.id);
        });
      }

      // Prepare tasks for insertion
      const tasksToInsert = [];
      for (const task of previewData) {
        const assigned_to = usersMap.get(task.assigned_to_email.toLowerCase());
        const creator_id = task.creator_name ? 
          creatorsMap.get(task.creator_name.toLowerCase()) : null;

        if (!assigned_to) {
          throw new Error(`User with email ${task.assigned_to_email} not found`);
        }

        tasksToInsert.push({
          title: task.title,
          description: task.description,
          status: task.status,
          due_date: task.due_date,
          assigned_to,
          creator_id,
          created_by: user.id
        });
      }

      // Insert in batches
      const batchSize = 10;
      for (let i = 0; i < tasksToInsert.length; i += batchSize) {
        const batch = tasksToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('tasks').insert(batch);
        
        if (error) throw error;
      }

      alert(`✅ ${tasksToInsert.length} tasks created successfully!`);
      router.push("/dashboard/tasks");
      router.refresh();
      
    } catch (error) {
      console.error("Bulk upload error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk Upload Tasks</h1>
          <p className="text-gray-600">Upload multiple tasks via CSV spreadsheet</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/tasks/new")}>
          Single Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Instructions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheetIcon className="h-5 w-5" />
              CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Download Template */}
            <div className="space-y-3">
              <h3 className="font-medium">Step 1: Download Template</h3>
              <Button 
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template CSV
              </Button>
              <p className="text-sm text-gray-500">
                Use the template to ensure correct formatting
              </p>
            </div>

            {/* Upload CSV */}
            <div className="space-y-3">
              <h3 className="font-medium">Step 2: Upload CSV</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Label 
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">Click to upload CSV</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                  <Button type="button" variant="secondary" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            </div>

            {/* CSV Format Instructions */}
            <div className="space-y-3">
              <h3 className="font-medium">CSV Format</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">title*</span>
                  <span className="text-gray-500">Required</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">description</span>
                  <span className="text-gray-500">Optional</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">status</span>
                  <span className="text-gray-500">todo/in_progress/blocked/done</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">due_date</span>
                  <span className="text-gray-500">YYYY-MM-DD</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">assigned_to_email*</span>
                  <span className="text-gray-500">User's email</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">creator_name</span>
                  <span className="text-gray-500">Creator's name</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Preview & Submit */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview & Submit</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-medium">Validation Errors ({errors.length})</h3>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errors.map((errorGroup, idx) => (
                    <div key={idx} className="text-sm p-2 bg-white rounded border">
                      <p className="font-medium">Row {errorGroup.row}:</p>
                      <ul className="list-disc list-inside text-red-500">
                        {errorGroup.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <p className="text-gray-500 text-xs mt-1">
                        Data: {JSON.stringify(errorGroup.data)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Tasks to Create ({previewData.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewData([]);
                      setErrors([]);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((task, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'done' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {task.status}
                            </span>
                          </TableCell>
                          <TableCell>{task.assigned_to_email}</TableCell>
                          <TableCell>{task.due_date || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {previewData.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500 border-t">
                      ... and {previewData.length - 10} more tasks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={loading || previewData.length === 0 || errors.length > 0}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Tasks...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create {previewData.length} Tasks
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}