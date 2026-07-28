 /**
 * History page component
 * [FEATURE-001] Added dynamic category creation: fetch categories, add category modal, pass categories to children
 */

import React, { useState, useEffect } from "react";
import { getExpenses, createExpense, fetchCategories, createCategory } from "../services/api";
import { Expense, ExpenseFormData, Category } from "../types";
import YearNavigation from "../components/YearNavigation";
import { MonthNavigation } from "../components/MonthNavigation";
import CategoryBreakdown from "../components/CategoryBreakdown";
import { CalendarExpenseTable } from "../components/CalendarExpenseTable";
import { ExpenseForm } from "../components/ExpenseForm";
import { Modal, Button, TextField } from "../vibes";
import { COLORS } from "../constants/colors";

const HistoryPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  // [FEATURE-001] Fixed: getInitialYearMonth now returns proper year/month from URL params or current date
  const getInitialYearMonth = () => {
    const params = new URLSearchParams(window.location.search);
    const currentDate = new Date();
    return {
      year: params.get("year") ? parseInt(params.get("year")!) : currentDate.getFullYear(),
      month: params.get("month") ? parseInt(params.get("month")!) : currentDate.getMonth() + 1,
    };
  };

  const initial = getInitialYearMonth();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);

  const updateURL = (year: number, month: number) => {
    const params = new URLSearchParams();
    params.set("year", year.toString());
    params.set("month", month.toString());
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => { updateURL(selectedYear, selectedMonth); }, []);
  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { fetchExpenses(); }, [selectedYear, selectedMonth]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses(selectedYear, selectedMonth);
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => { setSelectedYear(year); updateURL(year, selectedMonth); };
  const handleMonthChange = (month: number) => { setSelectedMonth(month); updateURL(selectedYear, month); };

  const handleAddExpense = async (data: ExpenseFormData) => {
    try {
      await createExpense(data);
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  };

  // [FEATURE-001] Fixed: Added missing if (!trimmedName) condition check for validation
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryError("Category name is required");
      return;
    }
    const exists = categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setCategoryError("A category with this name already exists");
      return;
    }
    setIsCreatingCategory(true);
    setCategoryError("");
    try {
      await createCategory(trimmedName);
      setNewCategoryName("");
      setIsAddCategoryModalOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      setCategoryError("Failed to create category. It may already exist.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const categoryData = expenses.reduce(
    (acc, expense) => {
      const cat = expense.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = { category: cat, amount: 0, count: 0 };
      }
      acc[cat].amount += Number(expense.amount);
      acc[cat].count += 1;
      return acc;
    },
    {} as Record<string, { category: string; amount: number; count: number }>,
  );

  const categoriesBreakdown = Object.values(categoryData).sort((a, b) => b.amount - a.amount);
  const total = categoriesBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
  const totalCount = categoriesBreakdown.reduce((sum, cat) => sum + cat.count, 0);

  const pageStyle: React.CSSProperties = { padding: "48px 64px", minHeight: "100vh", background: COLORS.secondary.s01 };
  const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "24px", justifyContent: "space-between" };
  const leftHeaderStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "24px" };
  const titleStyle: React.CSSProperties = { fontSize: "40px", fontWeight: 700, color: COLORS.secondary.s10, margin: 0, flexShrink: 0 };
  const loadingStyle: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", padding: "48px", fontSize: "18px", color: COLORS.secondary.s08 };
  const modalContentStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
  const modalButtonRowStyle: React.CSSProperties = { display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" };

  return (
    <div style={pageStyle}>
      {/* [FEATURE-001] Fixed: Properly closed header div before MonthNavigation */}
      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <h1 style={titleStyle}>Expense History</h1>
          <YearNavigation currentYear={selectedYear} onYearChange={handleYearChange} />
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Button variant="secondary" onClick={() => { setNewCategoryName(""); setCategoryError(""); setIsAddCategoryModalOpen(true); }}>
            + Add Category
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      <MonthNavigation currentMonth={selectedMonth} currentYear={selectedYear} onMonthChange={handleMonthChange} />

      <div>
        {loading ? (
          <div style={loadingStyle}>Loading...</div>
        ) : (
          <>
            <CategoryBreakdown categories={categoriesBreakdown} total={total} totalCount={totalCount} />
            <div style={{ marginTop: "32px" }}>
              <CalendarExpenseTable
                expenses={expenses}
                onExpenseUpdated={fetchExpenses}
                categories={categories}
              />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Expense">
        <ExpenseForm onSubmit={handleAddExpense} onCancel={() => setIsModalOpen(false)} categories={categories} />
      </Modal>

      {/* [FEATURE-001] Fixed: Wrapped Add Category modal content in <Modal> component */}
      {/* [FEATURE-001] Fixed: Added missing <Button> opening tag for Create Category button */}
      <Modal isOpen={isAddCategoryModalOpen} onClose={() => { setIsAddCategoryModalOpen(false); setNewCategoryName(""); setCategoryError(""); }} title="Add Category">
        <div style={modalContentStyle}>
          <TextField
            label="Category Name" type="text" placeholder="Enter category name (e.g., Groceries, Pets)"
            value={newCategoryName}
            onChange={(e) => { setNewCategoryName(e.target.value); if (categoryError) setCategoryError(""); }}
            error={categoryError} fullWidth required
          />
          <div style={modalButtonRowStyle}>
            <Button variant="secondary" onClick={() => { setIsAddCategoryModalOpen(false); setNewCategoryName(""); setCategoryError(""); }} disabled={isCreatingCategory}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryPage;
