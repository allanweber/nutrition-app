# Feature Prompt 003

## Feature Title
Retrieve foods from FatSecret API

## Summary
As a user, I want to be able to retrieve food information from the FatSecret API so that I can easily access nutritional data for various foods.

## Motivation
The FatSecret API provides a comprehensive database of food items and their nutritional information. By integrating this API, we can enhance our application's functionality and provide users with valuable insights into their dietary choices.

## Goals
- Integrate the FatSecret API to retrieve food information.
- Save retrieved food data in our database for quick access, save all alternasted measures and images provided by the API response.
- Saving the foods must be done asynchronously to avoid blocking the main thread and ensure a responsive user experience.
- On the food table always save the macros of the 100g serving size of the food, and save all the other serving sizes in a separate table linked to the food table, this way we can easily retrieve the macros for any serving size by calculating it based on the 100g serving size.
- Ensure that the retrieved data is accurate and up-to-date.
- Ensure there is no duplicate data in the database when retrieving food information multiple times.
- Implement error handling for API requests to manage potential issues such as rate limits or connectivity problems.
- Implement a search functionality that allows users to find specific foods based on keywords.
- **Always** retrieve the foods first from the database before making an API call to avoid unnecessary requests and reduce latency.
- Implement caching mechanisms to store frequently accessed food data, improving performance and reducing the number of API calls.
- Implement pagination for API responses to efficiently handle large datasets and improve user experience when browsing food items.
- Implement a user-friendly interface for displaying retrieved food information, including nutritional details and serving sizes.

## Non-Goals
-

## Scope
### In scope
- Integrating the FatSecret API to retrieve food information.
- Storing retrieved food data in our database.
- Implementing error handling for API requests.
- Implementing search functionality for food items.
- Implementing caching mechanisms for frequently accessed food data.
- Implementing pagination for API responses.
- Implementing a user-friendly interface for displaying food information.

### Out of scope
-

## Functional Requirements
1. Save foods in the table foods in the database.
2. Do not save duplicate foods in the database when retrieving food information multiple times, use fatssecret food_id to check if the food already exists in the database.
3. Store the following information for each food item: food_id, food_name, serving_size, calories, carbohydrates, protein, fat, and any other relevant nutritional information provided by the FatSecret API, all the images and serving sizes according to the API response and out own database schema. (foods.fullNutrients, foodPhotos, foodAltMeasures)
4. Oauth authentication to access the FatSecret API securely.
5. Implement error handling for API requests to manage potential issues such as rate limits or connectivity problems.
6. Implement a search functionality that allows users to find specific foods based on keywords.
7. Always retrieve the foods first from the database before making an API call to avoid unnecessary requests and reduce latency.
8. Implement caching mechanisms to store frequently accessed food data, improving performance and reducing the number of API calls.
9. Implement pagination for API responses to efficiently handle large datasets and improve user experience when browsing food items.
11. Implement unit tests to ensure the functionality of the food retrieval process and the accuracy of the stored data.
12. Implement integration tests to verify the correct interaction between our application and the FatSecret API.
13. Implement performance tests to ensure that the food retrieval process is efficient and does not cause significant delays for users.
14. Implement e2e tests to validate the overall user experience when retrieving and viewing food information.
15. Implement monitoring and logging for the food retrieval process to track API usage, identify potential issues, and ensure the reliability of the integration.

## Technical details

1. use the url for faatsecret wit relevant arguments: https://platform.fatsecret.com/rest/foods/search/v4?search_expression=peanut&format=json&max_results=10&page_number=0
2. xample of response from the API:
```json
{
    "foods_search": {
        "max_results": "10",
        "total_results": "2003",
        "page_number": "0",
        "results": {
            "food": [
                {
                    "food_id": "35718",
                    "food_name": "Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "32915",
                                "serving_description": "1 medium (2-3/4\" dia) (approx 3 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=32915&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium (2-3/4\" dia) (approx 3 per lb)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "58449",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=58449&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "32916",
                                "serving_description": "1 small (2-1/2\" dia) (approx 4 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=32916&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small (2-1/2\" dia) (approx 4 per lb)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.5",
                                "sugar": "11.01",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "32914",
                                "serving_description": "1 large (3-1/4\" dia) (approx 2 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=32914&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia) (approx 2 per lb)",
                                "calories": "110",
                                "carbohydrate": "29.28",
                                "protein": "0.55",
                                "fat": "0.36",
                                "saturated_fat": "0.059",
                                "polyunsaturated_fat": "0.108",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.03",
                                "vitamin_a": "6",
                                "vitamin_c": "9.8",
                                "calcium": "13",
                                "iron": "0.25"
                            },
                            {
                                "serving_id": "43637",
                                "serving_description": "1 oz",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples?portionid=43637&portionamount=1.000",
                                "metric_serving_amount": "28.350",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz",
                                "calories": "15",
                                "carbohydrate": "3.92",
                                "protein": "0.07",
                                "fat": "0.05",
                                "saturated_fat": "0.008",
                                "polyunsaturated_fat": "0.014",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "30",
                                "fiber": "0.7",
                                "sugar": "2.95",
                                "vitamin_a": "1",
                                "vitamin_c": "1.3",
                                "calcium": "2",
                                "iron": "0.03"
                            }
                        ]
                    }
                },
                {
                    "food_id": "1902657",
                    "food_name": "Honeycrisp Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "1868375",
                                "serving_description": "1 medium (2-3/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp?portionid=1868375&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia) (approx 3 per lb)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "1868386",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp?portionid=1868386&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "1868376",
                                "serving_description": "1 large (3-1/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp?portionid=1868376&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia) (approx 2 per lb)",
                                "calories": "110",
                                "carbohydrate": "29.28",
                                "protein": "0.55",
                                "fat": "0.36",
                                "saturated_fat": "0.059",
                                "polyunsaturated_fat": "0.108",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.03",
                                "vitamin_a": "6",
                                "vitamin_c": "9.8",
                                "calcium": "13",
                                "iron": "0.25"
                            },
                            {
                                "serving_id": "1868374",
                                "serving_description": "1 small (2-1/2\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp?portionid=1868374&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia) (approx 4 per lb)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.5",
                                "sugar": "11.01",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "1868382",
                                "serving_description": "1 oz, with skin, yields",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-honeycrisp?portionid=1868382&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz, with skin, yields",
                                "calories": "14",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            }
                        ]
                    }
                },
                {
                    "food_id": "568597",
                    "food_name": "Gala Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "591939",
                                "serving_description": "1 medium (2-3/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591939&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia)",
                                "calories": "71",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.24",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.4",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "591947",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591947&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "591938",
                                "serving_description": "1 small (2-1/2\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591938&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.6",
                                "sugar": "11.02",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "591940",
                                "serving_description": "1 large (3-1/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591940&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia)",
                                "calories": "109",
                                "carbohydrate": "29.27",
                                "protein": "0.56",
                                "fat": "0.36",
                                "saturated_fat": "0.060",
                                "polyunsaturated_fat": "0.107",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.04",
                                "vitamin_a": "6",
                                "vitamin_c": "9.9",
                                "calcium": "13",
                                "iron": "0.26"
                            },
                            {
                                "serving_id": "591944",
                                "serving_description": "1 oz",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591944&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz",
                                "calories": "13",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            },
                            {
                                "serving_id": "591943",
                                "serving_description": "1 slice",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-gala?portionid=591943&portionamount=1.000",
                                "metric_serving_amount": "17.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "slice",
                                "calories": "9",
                                "carbohydrate": "2.35",
                                "protein": "0.04",
                                "fat": "0.03",
                                "saturated_fat": "0.005",
                                "polyunsaturated_fat": "0.009",
                                "monounsaturated_fat": "0.001",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "18",
                                "fiber": "0.4",
                                "sugar": "1.77",
                                "vitamin_a": "1",
                                "vitamin_c": "0.8",
                                "calcium": "1",
                                "iron": "0.02"
                            }
                        ]
                    }
                },
                {
                    "food_id": "44911664",
                    "food_name": "Apple",
                    "brand_name": "Cosmic Crisp",
                    "food_type": "Brand",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/cosmic-crisp/apple",
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "38715860",
                                "serving_description": "1 apple",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/cosmic-crisp/apple",
                                "metric_serving_amount": "140.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "serving",
                                "calories": "100",
                                "carbohydrate": "24.00",
                                "protein": "0",
                                "fat": "0.50",
                                "saturated_fat": "0",
                                "trans_fat": "0",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "120",
                                "fiber": "6.0",
                                "sugar": "15.00",
                                "added_sugars": "0",
                                "vitamin_d": "0",
                                "calcium": "0",
                                "iron": "0.30"
                            },
                            {
                                "serving_id": "0",
                                "serving_description": "100 g",
                                "metric_serving_amount": "100.0",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.0",
                                "measurement_description": "g",
                                "calories": "71",
                                "carbohydrate": "17.14",
                                "protein": "0",
                                "fat": "0.36",
                                "saturated_fat": "0",
                                "trans_fat": "0",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "86",
                                "fiber": "4.3",
                                "sugar": "10.71",
                                "added_sugars": "0",
                                "vitamin_d": "0",
                                "calcium": "0",
                                "iron": "0.21"
                            }
                        ]
                    }
                },
                {
                    "food_id": "561206",
                    "food_name": "Fuji Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/6b5d0828-7391-49e6-ba02-606b0363d41e_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "584766",
                                "serving_description": "1 medium (2-3/4\" dia) (approx 3 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji?portionid=584766&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia) (approx 3 per lb)",
                                "calories": "71",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.24",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.4",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "584777",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji?portionid=584777&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "584767",
                                "serving_description": "1 large (3-1/4\" dia) (approx 2 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji?portionid=584767&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia) (approx 2 per lb)",
                                "calories": "109",
                                "carbohydrate": "29.27",
                                "protein": "0.56",
                                "fat": "0.36",
                                "saturated_fat": "0.060",
                                "polyunsaturated_fat": "0.107",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.04",
                                "vitamin_a": "6",
                                "vitamin_c": "9.9",
                                "calcium": "13",
                                "iron": "0.26"
                            },
                            {
                                "serving_id": "584765",
                                "serving_description": "1 small (2-1/2\" dia) (approx 4 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji?portionid=584765&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia) (approx 4 per lb)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.6",
                                "sugar": "11.02",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "584773",
                                "serving_description": "1 oz",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-fuji?portionid=584773&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz",
                                "calories": "13",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            }
                        ]
                    }
                },
                {
                    "food_id": "8374091",
                    "food_name": "Gala Apples",
                    "brand_name": "Michigan Apples",
                    "food_type": "Brand",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/michigan-apples/gala-apples",
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "8047529",
                                "serving_description": "1 large apple",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/michigan-apples/gala-apples",
                                "metric_serving_amount": "242.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "serving",
                                "calories": "130",
                                "carbohydrate": "34.00",
                                "protein": "1.00",
                                "fat": "0",
                                "saturated_fat": "0",
                                "sodium": "0",
                                "potassium": "185",
                                "fiber": "5.0",
                                "sugar": "25.00",
                                "vitamin_d": "0",
                                "calcium": "15",
                                "iron": "0.29"
                            },
                            {
                                "serving_id": "0",
                                "serving_description": "100 g",
                                "metric_serving_amount": "100.0",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.0",
                                "measurement_description": "g",
                                "calories": "54",
                                "carbohydrate": "14.05",
                                "protein": "0.41",
                                "fat": "0",
                                "saturated_fat": "0",
                                "sodium": "0",
                                "potassium": "76",
                                "fiber": "2.1",
                                "sugar": "10.33",
                                "vitamin_d": "0",
                                "calcium": "6",
                                "iron": "0.12"
                            }
                        ]
                    }
                },
                {
                    "food_id": "552071",
                    "food_name": "Pink Lady Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/b519abfe-43f6-4037-9e3a-c2719e4c4f9e_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/b519abfe-43f6-4037-9e3a-c2719e4c4f9e_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/b519abfe-43f6-4037-9e3a-c2719e4c4f9e_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "576072",
                                "serving_description": "1 medium (2-3/4\" dia) (approx 3 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady?portionid=576072&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia) (approx 3 per lb)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "576083",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady?portionid=576083&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "576071",
                                "serving_description": "1 small (2-1/2\" dia) (approx 4 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady?portionid=576071&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia) (approx 4 per lb)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.5",
                                "sugar": "11.01",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "576073",
                                "serving_description": "1 large (3-1/4\" dia) (approx 2 per lb)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady?portionid=576073&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia) (approx 2 per lb)",
                                "calories": "110",
                                "carbohydrate": "29.28",
                                "protein": "0.55",
                                "fat": "0.36",
                                "saturated_fat": "0.059",
                                "polyunsaturated_fat": "0.108",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.03",
                                "vitamin_a": "6",
                                "vitamin_c": "9.8",
                                "calcium": "13",
                                "iron": "0.25"
                            },
                            {
                                "serving_id": "576079",
                                "serving_description": "1 oz",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-pink-lady?portionid=576079&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz",
                                "calories": "14",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            }
                        ]
                    }
                },
                {
                    "food_id": "564224",
                    "food_name": "Granny Smith Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/a140650e-b159-4624-bd22-5e31a6561fd0_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/a140650e-b159-4624-bd22-5e31a6561fd0_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/a140650e-b159-4624-bd22-5e31a6561fd0_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "587696",
                                "serving_description": "1 medium (2-3/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587696&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.17"
                            },
                            {
                                "serving_id": "587707",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587707&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "587695",
                                "serving_description": "1 small (2-1/2\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587695&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia)",
                                "calories": "55",
                                "carbohydrate": "14.64",
                                "protein": "0.28",
                                "fat": "0.18",
                                "saturated_fat": "0.030",
                                "polyunsaturated_fat": "0.054",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.5",
                                "sugar": "11.01",
                                "vitamin_a": "3",
                                "vitamin_c": "4.9",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "587697",
                                "serving_description": "1 large (3-1/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587697&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia)",
                                "calories": "110",
                                "carbohydrate": "29.28",
                                "protein": "0.55",
                                "fat": "0.36",
                                "saturated_fat": "0.059",
                                "polyunsaturated_fat": "0.108",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.1",
                                "sugar": "22.03",
                                "vitamin_a": "6",
                                "vitamin_c": "9.8",
                                "calcium": "13",
                                "iron": "0.25"
                            },
                            {
                                "serving_id": "587703",
                                "serving_description": "1 oz, with skin, yields",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587703&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz, with skin, yields",
                                "calories": "14",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            },
                            {
                                "serving_id": "587705",
                                "serving_description": "1 serving (138 g)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-granny-smith?portionid=587705&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "serving (138g)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.039",
                                "polyunsaturated_fat": "0.070",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.34",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.17"
                            }
                        ]
                    }
                },
                {
                    "food_id": "564129",
                    "food_name": "Red Delicious Apples",
                    "food_type": "Generic",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious",
                    "food_images": {
                        "food_image": [
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/988b6456-af31-4e66-9322-ca1f9c5bbf00_1024x1024.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/988b6456-af31-4e66-9322-ca1f9c5bbf00_400x400.png",
                                "image_type": "0"
                            },
                            {
                                "image_url": "https://www.foodimagedb.com/food-images/988b6456-af31-4e66-9322-ca1f9c5bbf00_72x72.png",
                                "image_type": "0"
                            }
                        ]
                    },
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "587593",
                                "serving_description": "1 medium (2-3/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious?portionid=587593&portionamount=1.000",
                                "metric_serving_amount": "138.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "medium  (2-3/4\" dia)",
                                "calories": "72",
                                "carbohydrate": "19.06",
                                "protein": "0.36",
                                "fat": "0.23",
                                "saturated_fat": "0.038",
                                "polyunsaturated_fat": "0.071",
                                "monounsaturated_fat": "0.010",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "148",
                                "fiber": "3.3",
                                "sugar": "14.33",
                                "vitamin_a": "4",
                                "vitamin_c": "6.3",
                                "calcium": "8",
                                "iron": "0.16"
                            },
                            {
                                "serving_id": "587604",
                                "serving_description": "100 g",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious?portionid=587604&portionamount=100.000",
                                "metric_serving_amount": "100.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.000",
                                "measurement_description": "g",
                                "calories": "52",
                                "carbohydrate": "13.81",
                                "protein": "0.26",
                                "fat": "0.17",
                                "saturated_fat": "0.028",
                                "polyunsaturated_fat": "0.051",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "107",
                                "fiber": "2.4",
                                "sugar": "10.39",
                                "vitamin_a": "3",
                                "vitamin_c": "4.6",
                                "calcium": "6",
                                "iron": "0.12"
                            },
                            {
                                "serving_id": "587592",
                                "serving_description": "1 small (2-1/2\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious?portionid=587592&portionamount=1.000",
                                "metric_serving_amount": "106.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "small  (2-1/2\" dia)",
                                "calories": "56",
                                "carbohydrate": "14.64",
                                "protein": "0.27",
                                "fat": "0.18",
                                "saturated_fat": "0.029",
                                "polyunsaturated_fat": "0.055",
                                "monounsaturated_fat": "0.007",
                                "cholesterol": "0",
                                "sodium": "1",
                                "potassium": "113",
                                "fiber": "2.5",
                                "sugar": "11.01",
                                "vitamin_a": "3",
                                "vitamin_c": "4.8",
                                "calcium": "6",
                                "iron": "0.13"
                            },
                            {
                                "serving_id": "587594",
                                "serving_description": "1 large (3-1/4\" dia)",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious?portionid=587594&portionamount=1.000",
                                "metric_serving_amount": "212.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "large (3-1/4\" dia)",
                                "calories": "111",
                                "carbohydrate": "29.28",
                                "protein": "0.55",
                                "fat": "0.36",
                                "saturated_fat": "0.059",
                                "polyunsaturated_fat": "0.109",
                                "monounsaturated_fat": "0.015",
                                "cholesterol": "0",
                                "sodium": "2",
                                "potassium": "227",
                                "fiber": "5.0",
                                "sugar": "22.02",
                                "vitamin_a": "6",
                                "vitamin_c": "9.7",
                                "calcium": "13",
                                "iron": "0.25"
                            },
                            {
                                "serving_id": "587600",
                                "serving_description": "1 oz",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/generic/apples-red-delicious?portionid=587600&portionamount=1.000",
                                "metric_serving_amount": "26.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "oz",
                                "calories": "14",
                                "carbohydrate": "3.59",
                                "protein": "0.07",
                                "fat": "0.04",
                                "saturated_fat": "0.007",
                                "polyunsaturated_fat": "0.013",
                                "monounsaturated_fat": "0.002",
                                "cholesterol": "0",
                                "sodium": "0",
                                "potassium": "28",
                                "fiber": "0.6",
                                "sugar": "2.70",
                                "vitamin_a": "1",
                                "vitamin_c": "1.2",
                                "calcium": "2",
                                "iron": "0.03"
                            }
                        ]
                    }
                },
                {
                    "food_id": "3042163",
                    "food_name": "Fuji Apple Slices",
                    "brand_name": "Polar",
                    "food_type": "Brand",
                    "food_url": "https://foods.fatsecret.com/calories-nutrition/polar/fuji-apple-slices",
                    "servings": {
                        "serving": [
                            {
                                "serving_id": "2962041",
                                "serving_description": "1/2 cup",
                                "serving_url": "https://foods.fatsecret.com/calories-nutrition/polar/fuji-apple-slices",
                                "metric_serving_amount": "140.000",
                                "metric_serving_unit": "g",
                                "number_of_units": "1.000",
                                "measurement_description": "serving",
                                "calories": "50",
                                "carbohydrate": "12.00",
                                "protein": "0",
                                "fat": "0",
                                "saturated_fat": "0",
                                "polyunsaturated_fat": "0",
                                "monounsaturated_fat": "0",
                                "trans_fat": "0",
                                "cholesterol": "0",
                                "sodium": "20",
                                "potassium": "0",
                                "fiber": "2.0",
                                "sugar": "11.00"
                            },
                            {
                                "serving_id": "0",
                                "serving_description": "100 g",
                                "metric_serving_amount": "100.0",
                                "metric_serving_unit": "g",
                                "number_of_units": "100.0",
                                "measurement_description": "g",
                                "calories": "36",
                                "carbohydrate": "8.57",
                                "protein": "0",
                                "fat": "0",
                                "saturated_fat": "0",
                                "polyunsaturated_fat": "0",
                                "monounsaturated_fat": "0",
                                "trans_fat": "0",
                                "cholesterol": "0",
                                "sodium": "14",
                                "potassium": "0",
                                "fiber": "1.4",
                                "sugar": "7.86"
                            }
                        ]
                    }
                }
            ]
        }
    }
}
```

VERY IMPORTANT: Ask me if you have any questions or need further clarification on any of the requirements or goals mentioned above.
