const axios = require("axios");

const dataUrl = "https://dev.aux.boxpi.com/case-study/products";

interface Point {
    X: number;
    Y: number;
    Z: number;
}

interface InputData {
    productList: string[];
    startPosition: Point;
}

class Calculate {
    /**
     * Calculate route
     * @param dataIn
     * @returns
     */
    async calculate(dataIn: InputData) {
        let allPositions: any = [];
        for (let product of dataIn.productList) {
            let productUrl = `${dataUrl}/${product}/positions`;

            // Nacitaj pre kazdy produkty v liste jeho pozicie
            await axios
                .get(productUrl, {
                    method: "POST",
                    headers: {
                        "X-API-KEY": "MVGBMS0VQI555bTery9qJ91BfUpi53N24SkKMf9Z",
                    },
                })
                .then((response: any) => {
                    // kalkuluj len tie produkty, ktore maju definovane pozicie
                    if (response.data.length > 0) {
                        allPositions = [...allPositions, ...response.data];
                    }
                })
                .catch((error: any) => {
                    throw Error(
                        "Error reading https://dev.aux.boxpi.com/case-study: " +
                            error
                    );
                });
        }

        // return allPositions;
        const route = this._findRoute(
            dataIn.productList,
            allPositions,
            dataIn.startPosition
        );
        return route;
    }

    /**
     * Find optimized route
     * @param productListAll
     * @param allPositions
     * @param startPosition
     * @returns
     */
    _findRoute(productListAll: any, allPositions: any, startPosition: any) {
        // usporiadaj podla podlazia od najvyssieho
        allPositions.sort((a: { z: number }, b: { z: number }) => b.z - a.z);

        // zisti vsetky poschodia
        let allFloors = allPositions.map((pos: any) => pos.z);
        allFloors = [...new Set(allFloors)];

        // odstran poschodie na ktorom si (ak existuje) a daj ho na prve miesto
        // logika vyhladavania je najprv prejdi poschodie kde si a potom chod od najvyssieho dole
        const index = allFloors.indexOf(startPosition.z);
        index >= 0 && allFloors.splice(index, 1);
        allFloors.unshift(startPosition.z);

        // prejdi vsetky poschodia
        const route = this._traceFloors(
            allPositions,
            allFloors,
            productListAll,
            startPosition
        );
        return route;
    }

    /**
     * Trace route on all floors
     * @param allPositions
     * @param floor
     * @param productListAll
     * @param itemsLeft
     * @param startPosition
     * @returns
     */
    _traceFloors(
        allPositions: any,
        allFloors: any,
        productListAll: any,
        startPosition: any
    ) {
        let routeItems: any = []; // vybrane pozicie na trase
        let itemsLeft = [...productListAll]; // este nenajdene tovary
        let itemsLeftOnFloor = itemsLeft; // este nenajdene tovary na poschodi
        let routeLength; // celkova dzka trasy
        let routeLengthItems: any = []; // jednotlive vzdialenosti na trase

        // prejdi poschodia podla logiky poradia
        for (const floor of allFloors) {
            // console.log("Celkovo itemsLeft");
            // console.log(itemsLeft);

            // nastav vychodiskovu poziciu pre dalsie poschodie
            // pri prvom cykle zacne na startovacom poschodi, pri dalsom cykle sa nastavi: [0, 0, <poschodie>]
            startPosition = { ...startPosition, z: floor };

            // vyber vsetky pozicie na danom poschodi
            const floorPositions = allPositions.filter(
                (item: any) =>
                    item.z === floor && productListAll.includes(item.productId)
            );

            if (floorPositions.length === 0) {
                // ak neexistuje na danom poschodi hladany tovar, koniec hladania
                // console.log("Vynechavam poschodie: " + floor);
                continue;
            }

            // vyber len tie produkty, ktore sa nachadzaju na poschodi
            let itemsOnFloor = floorPositions.map((pos: any) => pos.productId);
            itemsOnFloor = [...new Set(itemsOnFloor)];
            // console.log("Produkty na poschodi: " + floor);
            // console.log(itemsOnFloor);

            // ponechaj na hladanie na poschodi len tie produkty, ktore sa este nenasli na predoslich poschodiach
            itemsLeftOnFloor = itemsOnFloor.filter((item: string) =>
                itemsLeft.includes(item)
            );
            // console.log("Zostava najst na poschodi: ");
            // console.log(itemsLeftOnFloor);

            let itemsOnFloorPositions = floorPositions.filter((pos: any) =>
                itemsLeftOnFloor.includes(pos.productId)
            );
            // console.log("Pozicie na poschodi: " + floor);
            // console.log(itemsOnFloorPositions);

            // vynechaj poschodie, ak neobsahuje polozky ktore ostava najst
            if (itemsLeftOnFloor.length === 0) continue;

            // vyber vsetky pozicie hladanych tovarov na poschodi a ich vzdialenosti od vozika
            ({ routeLengthItems, routeItems } = this._traceOneFloor(
                itemsLeftOnFloor,
                routeItems,
                routeLengthItems,
                startPosition,
                itemsOnFloorPositions
            ));

            // ponechaj na hladanie na dalsom poschodi len tie produkty, ktore sa este nenasli na tomto poschodi
            itemsLeftOnFloor = itemsOnFloor.filter((item: string) =>
                itemsLeft.includes(item)
            );

            // ponechaj na celkove hladanie len tie produkty, ktore sa este nenasli na tomto poschodi
            itemsLeft = itemsLeft.filter((x) => !itemsLeftOnFloor.includes(x));

            // nastav vychodiskovu poziciu pre dalsie poschodie
            startPosition = { x: 0, y: 0, z: 0 };
        }

        // vyrataj celkovu prejdenu trasu
        routeLength = routeLengthItems.reduce(function (a: number, b: number) {
            return a + b;
        });

        return {
            routeItems,
            routeLength,
            // routeLengthItems,
            // itemsLeft,
        };
    }

    /**
     * Trace route on one floor
     * @param itemsLeft
     * @param routeItems
     * @param routeLengthItems
     * @param startPosition
     * @param floorPositions
     * @returns
     */
    _traceOneFloor(
        itemsLeftOnFloor: any,
        routeItems: any,
        routeLengthItems: any,
        startPosition: any,
        floorPositions: any
    ) {
        // zisti vsetky pozicie a ich vzdialenosti od aktualnej pozicie
        let allDistances = [];
        for (const position of floorPositions) {
            allDistances.push({
                productId: position.productId,
                positionId: position.positionId,
                x: position.x,
                y: position.y,
                z: position.z,
                distance: this._getDistance(
                    [startPosition.x, startPosition.y, startPosition.z],
                    [position.x, position.y, position.z]
                ),
            });
        }
        // console.log("All distances (subproc): ");
        // console.log(allDistances);

        // najdi najblizsi tovar na poschodi od miesta kde som
        let nearest = allDistances.sort((a, b) => a.distance - b.distance)[0];
        // console.log("nearest (subproc): ");
        // console.log(nearest);

        // chod k najblisiemu, zapametaj si dlzku trasy a poziciu, kadial siel
        routeLengthItems.push(nearest.distance);
        routeItems.push({
            productId: nearest.productId,
            positionId: nearest.positionId,
            x: nearest.x,
            y: nearest.y,
            z: nearest.z,
        });

        // zmaz najdeny tovar zo zoznamu hladanych
        const index = itemsLeftOnFloor.indexOf(nearest.productId);
        itemsLeftOnFloor.splice(index, 1);
        // console.log("Zostava najst na poschodi (subproc): ");
        // console.log(itemsLeftOnFloor);

        // zmaz pozicie najdeneho produktu
        floorPositions = floorPositions.filter(
            (item: any) => item.productId !== nearest.productId
        );

        // ak je este co hladat, chod hladat dalsi produkt
        if (itemsLeftOnFloor.length > 0) {
            this._traceOneFloor(
                itemsLeftOnFloor,
                routeItems,
                routeLengthItems,
                { x: nearest.x, y: nearest.y, z: nearest.z },
                floorPositions
            );
        }

        return { routeLengthItems, routeItems };
    }

    /**
     * Get distance between two points
     * @param point1
     * @param point2
     * @returns
     */
    _getDistance(point1: any, point2: any) {
        const [x1, y1, z1] = point1;
        const [x2, y2, z2] = point2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return dist;
    }
}

module.exports = new Calculate();
