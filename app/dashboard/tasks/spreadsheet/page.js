"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SpreadsheetUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([
    { id: 1, title: "", description: "", status: "todo", due_date: "", assigned_to_email: "" }
  ]);
  const [availableEmails, setAvailableEmails] = useState([]);
  
  // Fetch user emails on mount
  useEffect(() => {
    fetchUserEmails();
  }, []);

  const fetchUserEmails = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .not('email', 'is', null);

      if (error) throw error;

      if (data) {
        setAvailableEmails(data.map(p => p.email || ''));
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  };

  // Add new row
  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, {
      id: newId,
      title: "",
      description: "",
      status: "todo",
      due_date: "",
      assigned_to_email: ""
    }]);
  };

  // Remove row
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  // Update cell value
  const updateCell = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, rowId, cellIndex) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = rows.findIndex(row => row.id === rowId);
      
      if (currentIndex < rows.length - 1) {
        // Move to next row
        const nextInput = document.querySelector(`[data-row-id="${rows[currentIndex + 1].id}"][data-cell-index="0"]`);
        if (nextInput) nextInput.focus();
      } else {
        // Add new row and focus
        addRow();
        setTimeout(() => {
          const newRowInput = document.querySelector(`[data-row-id="${rows.length + 1}"][data-cell-index="0"]`);
          if (newRowInput) newRowInput.focus();
        }, 100);
      }
    }
  };

  // Submit all rows
  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Validate rows
      const validRows = rows.filter(row => row.title.trim() && row.assigned_to_email.trim());
      
      if (validRows.length !== rows.length) {
        alert("Please fill all required fields (Title and Assignee)");
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication failed");
      }

      // Fetch user emails mapping
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profileError) throw profileError;
      
      const emailToId = new Map();
      if (profiles) {
        profiles.forEach(p => {
          if (p.email) {
            emailToId.set(p.email.toLowerCase(), p.id);
          }
        });
      }

      // Prepare tasks
      const tasks = [];
      for (const row of validRows) {
        const assigned_to = emailToId.get(row.assigned_to_email.toLowerCase());
        
        if (!assigned_to) {
          throw new Error(`User with email ${row.assigned_to_email} not found`);
        }

        tasks.push({
          title: row.title,
          description: row.description,
          status: row.status,
          due_date: row.due_date || null,
          assigned_to,
          created_by: user.id
        });
      }

      // Insert tasks
      const { error } = await supabase
        .from('tasks')
        .insert(tasks);

      if (error) throw error;

      alert(`✅ ${tasks.length} tasks created successfully!`);
      router.push("/dashboard/tasks");
      
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            Spreadsheet Task Creator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Add tasks like a spreadsheet. Press Tab to move between cells.
            </div>
            <div className="flex gap-2">
              <Button onClick={addRow} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating..." : "Create All Tasks"}
              </Button>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="border rounded-lg overflow-auto max-h-[500px]">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Title *</TableHead>
                  <TableHead className="min-w-[300px]">Description</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Due Date</TableHead>
                  <TableHead className="min-w-[180px]">Assignee Email *</TableHead>
                  <TableHead className="w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    
                    {/* Title */}
                    <TableCell>
                      <Input
                        value={row.title}
                        onChange={(e) => updateCell(row.id, 'title', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 0)}
                        placeholder="Task title..."
                        className="border-0 focus:ring-0 focus-visible:ring-0"
                        data-row-id={row.id}
                        data-cell-index="0"
                      />
                    </TableCell>
                    
                    {/* Description */}
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => updateCell(row.id, 'description', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 1)}
                        placeholder="Task description..."
                        className="border-0 focus:ring-0 focus-visible:ring-0"
                        data-row-id={row.id}
                        data-cell-index="1"
                      />
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      <Select
                        value={row.status}
                        onValueChange={(value) => updateCell(row.id, 'status', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    {/* Due Date */}
                    <TableCell>
                      <Input
                        type="date"
                        value={row.due_date}
                        onChange={(e) => updateCell(row.id, 'due_date', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id, 3)}
                        className="border-0 focus:ring-0 focus-visible:ring-0"
                        data-row-id={row.id}
                        data-cell-index="3"
                      />
                    </TableCell>
                    
                    {/* Assignee */}
                    <TableCell>
                      <div className="relative">
                        <Input
                          value={row.assigned_to_email}
                          onChange={(e) => updateCell(row.id, 'assigned_to_email', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 4)}
                          placeholder="user@example.com"
                          className="border-0 focus:ring-0 focus-visible:ring-0 pr-8"
                          list={`email-list-${row.id}`}
                          data-row-id={row.id}
                          data-cell-index="4"
                        />
                        <datalist id={`email-list-${row.id}`}>
                          {availableEmails.map((email, idx) => (
                            <option key={idx} value={email} />
                          ))}
                        </datalist>
                      </div>
                    </TableCell>
                    
                    {/* Action */}
                    <TableCell>
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Fill cells like a spreadsheet - use Tab to navigate</li>
              <li>• Required fields: <strong>Title</strong> and <strong>Assignee Email</strong></li>
              <li>• Status defaults to &quot;To Do&quot;</li>
              <li>• Delete rows with the trash icon (minimum 1 row)</li>
              <li>• Click &quot;Add Row&quot; to add more tasks</li>
              <li>• Email field will auto-suggest available users</li>
            </ul>
          </div>

          {/* Summary */}
          <div className="mt-4 flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {rows.length} row{rows.length !== 1 ? 's' : ''} ready for creation
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Creating..." : `Create ${rows.length} Tasks`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}