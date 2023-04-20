# Development and Usage

Instalation:
npm i
npm run dev

Usage:
Insomnia request:
type: get
url: http://localhost:3000/optimize
Content-Type: application/json
JSON data: 
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




