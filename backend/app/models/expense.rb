class Expense < ApplicationRecord
  belongs_to :category

  # [BONUS-001] Reject future-dated expenses regardless of how the API is called.
  validate :date_cannot_be_in_the_future

  private

  # [BONUS-001] Allow expenses dated today or earlier in the application's time zone.
  def date_cannot_be_in_the_future
    return if date.blank? || date <= Date.current

    errors.add(:date, "must be today or in the past")
  end
end
