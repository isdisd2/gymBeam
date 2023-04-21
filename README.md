# Development and Usage

## Instalation:

npm i\
npm run dev

## Usage:

### Insomnia request:\

type: get\
url: http://localhost:3000/optimize \
Content-Type: application/json \
JSON data: \
{
"productList": [
"product-2",
"product-1",
"product-4",
"product-3"
],
"startPosition": {
"x": 0,
"y": 2,
"z": 100
}
}

## Logic of calculation

The search logic is - first go to the floor where you are and then go from the highest floor to the lowest. \
When changing the floor, the coordinates [0, 0, <floorNumber>] are considered as the starting position.
