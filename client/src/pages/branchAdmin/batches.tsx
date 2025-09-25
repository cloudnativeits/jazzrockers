import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import ReactSelect from "react-select";
import React, { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Course } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/page-header";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function BranchAdminBatches() {
    const [activeTab, setActiveTab] = useState("batches");

    const [filters, setFilters] = useState({
        name: "",
        brandId: "",
        courseId: "",
        branch: "",
        selectedBatchId: null as number | null,
    });

    const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
        queryKey: ["/api/batches"],
    });

    const { data: brands = [], isLoading: isLoadingBrands } = useQuery<any[]>({
        queryKey: ["/api/brands"],
    });

    const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ["/api/courses"],
    });

    const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
        queryKey: ["/api/branches"],
    });

    const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<any[]>({
        queryKey: ["/api/departments"],
    });

    const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ["/api/enrollments/batch", filters.selectedBatchId],
        queryFn: async () => {
            if (!filters.selectedBatchId) return [];
            const res = await fetch(`/api/enrollments/batch/${filters.selectedBatchId}`);
            if (!res.ok) throw new Error("Failed to fetch enrollments");
            return res.json();
        },
        enabled: !!filters.selectedBatchId,
    });

    const sortedData = enrollments.slice().sort((a: any, b: any) => {
        if (a.status === "inactive" && b.status !== "inactive") return 1;
        if (a.status !== "inactive" && b.status === "inactive") return -1;
        return 0;
    });

    const handleRemoveStudent = async (enrollment: any) => {
        const studentId = enrollment.student_id;
        const batchId = enrollment.batch_id;
      
        if (!studentId || !batchId) {
          toast({
            title: "Error",
            description: "Missing student ID or batch ID",
            variant: "destructive",
          });
          return;
        }
      
        try {
          const res = await fetch("/api/enrollments/deactivate", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, batchId }),
          });
      
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to update enrollments");
          }
      
          toast({
            title: "Student Removed",
            description: "All enrollments for this student in the batch are now inactive.",
          });
      
          queryClient.invalidateQueries({ queryKey: ["/api/enrollments/batch"] });
        } catch (error) {
          toast({
            title: "Error",
            description: (error as Error).message,
            variant: "destructive",
          });
        }
      };      
    
      const batchStrength: React.FC<{ row: any }> = ({ row }) => {
        const [count, setCount] = React.useState<number | null>(null);
    
        React.useEffect(() => {
          const batchId = row.original.id;
          fetch(`/api/student-count?batchId=${batchId}`)
            .then(res => res.json())
            .then(data => setCount(data.studentCount))
            .catch(() => setCount(0));
        }, [row.original.id]);
    
        return count !== null ? count : "Loading...";
      }; 

    // Columns for batches table
    const batchColumns: ColumnDef<any>[] = [
        {
            id: "serial",
            header: "SL.No.",
            cell: ({ table, row }) => {
                const sortedRows = table.getSortedRowModel().rows;
                const index = sortedRows.findIndex((r) => r.id === row.id);
                return <div>{index + 1}</div>;
            },
            enableSorting: false,
        },
        {
            accessorKey: "name",
            header: "Batch Name",
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "strength",
            header: "Strength",
            cell: batchStrength,
        },
        {
            accessorKey: "branch",
            header: "Branch",
            cell: ({ row }) => <div>{row.getValue("branch")}</div>,
        },
        {
            accessorKey: "category",
            header: "Department",
            cell: ({ row }) => {
                const departmentId = parseInt(row.getValue("category") as string, 10);
                const department = departments.find((d: any) => d.id === departmentId);
                return department ? department.name : "Unknown Department";
            },
        },
        {
            accessorKey: "courseId",
            header: "Course",
            cell: ({ row }) => {
                const courseId = row.getValue("courseId") as number;
                const course = courses.find((c) => c.id === courseId);
                return course ? course.name : "Unknown Course";
            },
        },
    ];

    const enrollmentColumns: ColumnDef<any>[] = [
        {
            id: "serial",
            header: "SL.No.",
            cell: ({ table, row }) => {
                const sortedRows = table.getSortedRowModel().rows;
                const index = sortedRows.findIndex((r) => r.id === row.id);
                return <div>{index + 1}</div>;
            },
            enableSorting: false,
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const first = row.original.first_name || "";
                const middle = row.original.middle_name || "";
                const last = row.original.last_name || "";

                const fullName = [first, middle, last].filter(Boolean).join(" ");
                return <span>{fullName}</span>;
            },
        },
        // {
        //     accessorKey: "course_id",
        //     header: "Course",
        //     cell: ({ row }) => {
        //         const courseId = row.getValue("course_id");
        //         const parsedId = typeof courseId === "string" ? parseInt(courseId) : courseId;
        //         const course = courses.find((c) => c.id === parsedId);
        //         return course ? course.name : `Unknown (ID: ${courseId ?? "?"})`;
        //     },
        // },
        // {
        //     accessorKey: "branch_id",
        //     header: "Branch",
        //     cell: ({ row }) => {
        //         const branchId = row.getValue("branch_id");
        //         const parsedId = typeof branchId === "string" ? parseInt(branchId) : branchId;
        //         const branch = branches.find((b) => b.id === parsedId);
        //         return branch ? branch.name : `Unknown (ID: ${branchId ?? "?"})`;
        //     },
        // },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "outline";

                if (status === "active") badgeVariant = "secondary";
                else if (status === "inactive") badgeVariant = "destructive";
                else if (status === "completed") badgeVariant = "default";

                return <Badge variant={badgeVariant}>{capitalizeFirstLetter(status)}</Badge>;
            },
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const status = row.original.status;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="bg-red-700 text-white"
                            size="sm"
                            onClick={() => handleRemoveStudent(row.original)}
                            disabled={status === "inactive"}
                            title={status === "inactive" ? "Student already inactive" : "Remove Student"}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                        </Button>
                    </div>
                );
            },
        }
    ];

    // Filter batches by current filters.name, brandId, courseId, branch
    const filteredBatches = batches.filter((batch) => {
        const selectedBranch = branches.find((b) => b.id.toString() === filters.branch)?.name;
        const course = courses.find((c) => c.id === batch.courseId);
        const derivedBrandId = course?.brandId?.toString() || null;

        const matchesName = !filters.name || batch.name === filters.name;
        const matchesBrand = !filters.brandId || derivedBrandId === filters.brandId;
        const matchesCourse = !filters.courseId || batch.courseId === Number(filters.courseId);
        const matchesBranch = !filters.branch || batch.branch === selectedBranch;
        return matchesName && matchesBrand && matchesCourse && matchesBranch;
    });

    console.log("filters.brandId:", filters.brandId);
console.log("batches:", batches);
console.log(
  "filteredBatches:",
  batches.filter(batch => batch.brandId?.toString() === filters.brandId)
);

    return (
        <AppShell>
            <PageHeader
                title="All Batches"
                description="Manage batches offered by jazzrockers."
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsContent value="batches" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-2">
                        {/* Batch name select - sets filters.name & selectedBatchId */}
                        <ReactSelect
                            value={filters.name ? { label: filters.name, value: filters.name } : null}
                            onChange={(selectedOption) => {
                                const batchName = selectedOption?.value || "";
                                const batch = batches.find((b) => b.name === batchName);
                                setFilters({
                                    ...filters,
                                    name: batchName,
                                    selectedBatchId: batch ? batch.id : null,
                                });
                            }}
                            options={[
                                { label: "All Batches", value: "" },
                                ...[...new Set(batches.map((b) => b.name))].map((name) => ({
                                    label: name,
                                    value: name,
                                })),
                            ]}
                            isClearable
                            placeholder="Select Batch"
                            className="w-full text-sm"
                        />

                        {/* Other filters unchanged */}
                        <ReactSelect
                            value={
                                filters.brandId
                                    ? {
                                        label: brands.find((b) => b.id.toString() === filters.brandId)?.name,
                                        value: filters.brandId,
                                    }
                                    : null
                            }
                            onChange={(selectedOption) =>
                                setFilters({ ...filters, brandId: selectedOption?.value || "" })
                            }
                            options={[
                                { label: "All Brands", value: "" },
                                ...brands.map((b) => ({
                                    label: b.name,
                                    value: b.id.toString(),
                                })),
                            ]}
                            isClearable
                            placeholder="Select Brand"
                            className="w-full text-sm"
                        />

                        <ReactSelect
                            value={
                                filters.branch
                                    ? {
                                        label: branches.find((b) => b.id.toString() === filters.branch)?.name,
                                        value: filters.branch,
                                    }
                                    : null
                            }
                            onChange={(selectedOption) =>
                                setFilters({ ...filters, branch: selectedOption?.value || "" })
                            }
                            options={[
                                { label: "All Branches", value: "" },
                                ...branches.map((b) => ({
                                    label: b.name,
                                    value: b.id.toString(),
                                })),
                            ]}
                            isClearable
                            placeholder="Select Branch"
                            className="w-full text-sm"
                        />

                        <ReactSelect
                            value={
                                filters.courseId
                                    ? {
                                        label: courses.find((c) => c.id === Number(filters.courseId))?.name,
                                        value: filters.courseId,
                                    }
                                    : null
                            }
                            onChange={(selectedOption) =>
                                setFilters({ ...filters, courseId: selectedOption?.value || "" })
                            }
                            options={[
                                { label: "All Courses", value: "" },
                                ...courses.map((c) => ({
                                    label: c.name,
                                    value: c.id.toString(),
                                })),
                            ]}
                            isClearable
                            placeholder="Select Course"
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Batches DataTable */}
                    <DataTable
                        columns={batchColumns}
                        data={filteredBatches}
                        searchPlaceholder="Search batches..."
                        initialSorting={[{ id: "name", desc: true }]}
                    />

                    {/* Enrollments DataTable - only if a batch is selected */}
                    {filters.selectedBatchId && (
                        <div className="mt-10">
                            <h3 className="text-lg font-semibold mb-3">
                                Enrollments for batch:{" "}
                                {batches.find((b) => b.id === filters.selectedBatchId)?.name || ""}
                            </h3>

                            {isLoadingEnrollments ? (
                                <p>Loading enrollments...</p>
                            ) : enrollments.length === 0 ? (
                                <p>No enrollments found for this batch.</p>
                            ) : (
                                <DataTable
                                    columns={enrollmentColumns}
                                    data={sortedData}
                                    searchPlaceholder="Search enrollments..."
                                    initialSorting={[{ id: "name", desc: false }]}
                                />
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </AppShell>
    );
}
