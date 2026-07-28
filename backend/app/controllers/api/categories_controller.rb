class Api::CategoriesController < ApplicationController
  # [FEATURE-001] GET /api/categories - List all categories ordered by name
  def index
    categories = Category.order(:name)
    render json: categories
  end

  # [FEATURE-001] POST /api/categories - Create a new category
  def create
    category = Category.new(category_params)

    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  # [FEATURE-001] Strong params for category creation
  def category_params
    params.require(:category).permit(:name)
  end
end
