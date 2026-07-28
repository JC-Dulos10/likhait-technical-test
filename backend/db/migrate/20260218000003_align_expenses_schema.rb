class AlignExpensesSchema < ActiveRecord::Migration[7.2]
  def up
    unless column_exists?(:expenses, :date)
      add_column :expenses, :date, :date
      execute "UPDATE expenses SET date = DATE(created_at) WHERE date IS NULL"
      change_column_null :expenses, :date, false
    end

    change_column_null :expenses, :payer_name, true if column_exists?(:expenses, :payer_name)
  end

  def down
    change_column_null :expenses, :payer_name, false if column_exists?(:expenses, :payer_name)
    remove_column :expenses, :date if column_exists?(:expenses, :date)
  end
end