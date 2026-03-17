import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Upload, FileText, Users, CheckCircle2, DollarSign } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import type { Contact } from '../lib/appStore';
import { toast } from 'sonner';
import { Label } from '../components/ui/label';

export const ImportExport = () => {
  const { contacts, actions, deals, storeActions } = useAppStore('contacts', 'actions', 'deals');
  const [importing, setImporting] = useState(false);

  // Export Contacts to CSV
  const exportContactsToCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Phone', 'Status', 'Tags', 'Created At'];
    const rows = contacts.map(contact => [
      contact.name,
      contact.email,
      contact.company,
      contact.phone,
      contact.status,
      contact.tags.join(';'),
      contact.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadCSV(csvContent, 'contacts.csv');
    toast.success('Contacts exported successfully!');
  };

  // Export Actions to CSV
  const exportActionsToCSV = () => {
    const headers = ['Contact ID', 'Type', 'Description', 'Due Date', 'Completed', 'Completed At', 'Created At'];
    const rows = actions.map(action => [
      action.contactId,
      action.type,
      action.description,
      action.dueDate,
      action.completed ? 'Yes' : 'No',
      action.completedAt || '',
      action.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadCSV(csvContent, 'actions.csv');
    toast.success('Actions exported successfully!');
  };

  // Export Deals to CSV
  const exportDealsToCSV = () => {
    const headers = ['Contact ID', 'Title', 'Value', 'Stage', 'Probability', 'Expected Close Date', 'Created At', 'Updated At'];
    const rows = deals.map(deal => [
      deal.contactId,
      deal.title,
      deal.value.toString(),
      deal.stage,
      deal.probability.toString(),
      deal.expectedCloseDate,
      deal.createdAt,
      deal.updatedAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadCSV(csvContent, 'deals.csv');
    toast.success('Deals exported successfully!');
  };

  // Export All Data as JSON
  const exportAllDataAsJSON = () => {
    const data = {
      contacts,
      actions,
      deals,
      exportDate: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Full backup exported successfully!');
  };

  // Helper function to download CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Contacts from CSV
  const handleImportContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          // Parse CSV line (basic implementation)
          const values = lines[i].match(/(\".*?\"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];

          if (values.length < 5) continue; // Skip invalid rows

          const contact: Omit<Contact, 'id' | 'createdAt'> = {
            name: values[0] || '',
            email: values[1] || '',
            company: values[2] || '',
            phone: values[3] || '',
            status: (values[4] as Contact['status']) || 'lead',
            tags: values[5] ? values[5].split(';').filter(t => t.trim()) : [],
          };

          const result = await storeActions.createContact(contact);
          if (result.success) importedCount++;
        }

        toast.success(`Successfully imported ${importedCount} contacts!`);
      } catch (error) {
        toast.error('Error importing contacts. Please check the CSV format.');
        console.error(error);
      } finally {
        setImporting(false);
        event.target.value = ''; // Reset file input
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl">Import & Export</h1>
        <p className="text-muted-foreground mt-1">Manage your CRM data portability</p>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contacts CSV</CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export all contacts ({contacts.length}) to CSV format
              </p>
              <Button onClick={exportContactsToCSV} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Contacts
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Actions CSV</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export all actions ({actions.length}) to CSV format
              </p>
              <Button onClick={exportActionsToCSV} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Actions
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Deals CSV</CardTitle>
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export all deals ({deals.length}) to CSV format
              </p>
              <Button onClick={exportDealsToCSV} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Deals
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Full Backup</CardTitle>
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export everything as JSON backup
              </p>
              <Button onClick={exportAllDataAsJSON} className="w-full" variant="default">
                <Download className="w-4 h-4 mr-2" />
                Backup All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Import Data</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Contacts from CSV</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Upload a CSV file with contacts to add them to your CRM
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-brand-primary-light p-4 rounded-md space-y-2">
              <p className="text-sm font-medium text-brand-main">Required CSV Format:</p>
              <p className="text-xs text-brand-primary font-mono">
                Name, Email, Company, Phone, Status, Tags, Created At
              </p>
              <div className="pt-2">
                <p className="text-sm font-medium text-brand-main">Example:</p>
                <p className="text-xs text-brand-primary font-mono">
                  "John Doe","john@example.com","Acme Corp","+1234567890","lead","tech;startup","2026-01-01T10:00:00Z"
                </p>
              </div>
              <div className="pt-2">
                <p className="text-sm font-medium text-brand-main">Notes:</p>
                <ul className="text-xs text-brand-primary list-disc list-inside space-y-1">
                  <li>Status must be: lead, active, won, or lost</li>
                  <li>Tags should be separated by semicolons (;)</li>
                  <li>Created At is optional (will use current date if not provided)</li>
                </ul>
              </div>
            </div>

            <div>
              <Label htmlFor="import-contacts">Select CSV File</Label>
              <input
                id="import-contacts"
                type="file"
                accept=".csv"
                onChange={handleImportContacts}
                disabled={importing}
                className="mt-2 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {importing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Importing contacts...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-warning-mid bg-brand-warning-light">
          <CardHeader>
            <CardTitle className="text-brand-warning">Import Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-brand-main space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Ensure your CSV file is properly formatted with all required columns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Duplicate contacts (same email) will be added as separate entries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Invalid rows will be skipped automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>We recommend exporting a sample CSV first to see the correct format</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};