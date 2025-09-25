import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

export default function FeeStructure() {
  const [activeTab, setActiveTab] = useState("oneTime");
  const [oneTimeCreateDialog, setOneTimeCreateDialog] = useState(false);
  const [recurringFeesCreateDialog, setRecurringFeesCreateDialog] = useState(false);

  const oneTimeFees = [
    { id: 1, particulars: "Registration fee", amount: "AED 250" },
    { id: 2, particulars: "Sibling Registration fee", amount: "AED 150" },
    { id: 3, particulars: "Stationary fee - 1 term", amount: "AED 100" },
    { id: 4, particulars: "Book fee - 1 term", amount: "AED 150" },
    { id: 5, particulars: "Regular Uniform - T-shirt", amount: "AED 50" },
    { id: 6, particulars: "Regular Uniform - Shorts", amount: "AED 50" },
    { id: 7, particulars: "PE uniform T-shirt", amount: "AED 55" },
    { id: 8, particulars: "PE uniform - Track pants", amount: "AED 55" },
  ];

  const jazzRockers = [
    { id: 1, particulars: "Registration fee", amount: "AED 100" },
    { id: 2, particulars: "Sibling Registration fee", amount: "AED 50" },
    { id: 3, particulars: "Teachers Diary", amount: "AED 25" },
    { id: 4, particulars: "JazzRockers T-shirt (additional)", amount: "AED 50" },
    { id: 5, particulars: "Classical Dance - Shawl", amount: "AED 50" },
  ];

  const prodigyBooks = [
    {
      grade: "Nursery",
      theory: "AED 35",
      drum: "AED 40",
      guitar: "AED 40",
      violin: "-",
      vocal: "-",
      piano: "-"
    },
    {
      grade: "Basic 1 & 2",
      theory: "AED 35",
      drum: "AED 40",
      guitar: "AED 40",
      violin: "-",
      vocal: "-",
      piano: "-"
    },
    {
      grade: "Junior",
      theory: "AED 35",
      drum: "AED 40",
      guitar: "AED 40",
      violin: "AED 35",
      vocal: "AED 40",
      piano: "AED 35"
    },
    // Add more grades as per the image...
  ];

  const fineArtsBooks = [
    { grade: "Basic 1", amount: "AED 35" },
    { grade: "Basic 2", amount: "AED 40" },
    { grade: "Grade 1", amount: "AED 40" },
    { grade: "Grade 2", amount: "AED 35" },
  ];

  return (
    <AppShell>
    {/* <div className="container mx-auto p-6"> */}
    <PageHeader
        title="Fee Structure"
        description="Manage fee structure for one time and recurring fees."
        actions={
          <Button onClick={() => {
            if (activeTab === "onetimefees") {
              setOneTimeCreateDialog(true);
            } else if (activeTab === "recurringfees") {
              setRecurringFeesCreateDialog(true);
            } 
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {
                  activeTab === "recurringfees" ? "Add Recurring Fee" : "Add One Time Fee"}
          </Button>
        }
      />
      
      <Tabs defaultValue="one-time">
        <TabsList className="mb-4">
          <TabsTrigger value="one-time">One Time Fees</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="one-time">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Circle Time</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead>Fee Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oneTimeFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.id}</TableCell>
                          <TableCell>{fee.particulars}</TableCell>
                          <TableCell>{fee.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">JAZZROCKERS</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead>Fee Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jazzRockers.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.id}</TableCell>
                          <TableCell>{fee.particulars}</TableCell>
                          <TableCell>{fee.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Prodigy Book</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade Name</TableHead>
                        <TableHead>Theory</TableHead>
                        <TableHead>Drum</TableHead>
                        <TableHead>Guitar</TableHead>
                        <TableHead>Violin</TableHead>
                        <TableHead>Vocal</TableHead>
                        <TableHead>Piano</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prodigyBooks.map((book, index) => (
                        <TableRow key={index}>
                          <TableCell>{book.grade}</TableCell>
                          <TableCell>{book.theory}</TableCell>
                          <TableCell>{book.drum}</TableCell>
                          <TableCell>{book.guitar}</TableCell>
                          <TableCell>{book.violin}</TableCell>
                          <TableCell>{book.vocal}</TableCell>
                          <TableCell>{book.piano}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">FINE ARTS BOOK</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade Name</TableHead>
                        <TableHead>Fee Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fineArtsBooks.map((book, index) => (
                        <TableRow key={index}>
                          <TableCell>{book.grade}</TableCell>
                          <TableCell>{book.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recurring Fees</h2>
              <p className="text-gray-500">Content for recurring fees will be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
