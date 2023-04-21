"use strict";
class CalculateHelper {
    /**
     * Find optimized route
     * @param productListAll
     * @param allPositions
     * @param startPosition
     * @returns
     */
    findRoute(productListAll, allPositions, startPosition) {
        // usporiadaj podla podlazia od najvyssieho
        allPositions.sort((a, b) => b.z - a.z);
        // zisti vsetky poschodia
        let allFloors = allPositions.map((pos) => pos.z);
        allFloors = [...new Set(allFloors)];
        // odstran poschodie na ktorom si (ak existuje) a daj ho na prve miesto
        // logika vyhladavania je najprv prejdi poschodie kde si a potom chod od najvyssieho dole
        const index = allFloors.indexOf(startPosition.z);
        index >= 0 && allFloors.splice(index, 1);
        allFloors.unshift(startPosition.z);
        // prejdi vsetky poschodia
        const route = this.traceFloors(allPositions, allFloors, productListAll, startPosition);
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
    traceFloors(allPositions, allFloors, productListAll, startPosition) {
        let routeItems = []; // vybrane pozicie na trase
        let itemsLeft = [...productListAll]; // este nenajdene tovary
        let itemsLeftOnFloor = itemsLeft; // este nenajdene tovary na poschodi
        let routeLength; // celkova dzka trasy
        let routeLengthItems = []; // jednotlive vzdialenosti na trase
        // prejdi poschodia podla logiky poradia
        for (const floor of allFloors) {
            // console.log("Celkovo itemsLeft");
            // console.log(itemsLeft);
            // nastav vychodiskovu poziciu pre dalsie poschodie
            // pri prvom cykle zacne na startovacom poschodi, pri dalsom cykle sa nastavi: [0, 0, <poschodie>]
            startPosition = Object.assign(Object.assign({}, startPosition), { z: floor });
            // vyber vsetky pozicie na danom poschodi
            const floorPositions = allPositions.filter((item) => item.z === floor && productListAll.includes(item.productId));
            if (floorPositions.length === 0) {
                // ak neexistuje na danom poschodi hladany tovar, koniec hladania
                // console.log("Vynechavam poschodie: " + floor);
                continue;
            }
            // vyber len tie produkty, ktore sa nachadzaju na poschodi
            let itemsOnFloor = floorPositions.map((pos) => pos.productId);
            itemsOnFloor = [...new Set(itemsOnFloor)];
            // console.log("Produkty na poschodi: " + floor);
            // console.log(itemsOnFloor);
            // ponechaj na hladanie na poschodi len tie produkty, ktore sa este nenasli na predoslich poschodiach
            itemsLeftOnFloor = itemsOnFloor.filter((item) => itemsLeft.includes(item));
            // console.log("Zostava najst na poschodi: ");
            // console.log(itemsLeftOnFloor);
            let itemsOnFloorPositions = floorPositions.filter((pos) => itemsLeftOnFloor.includes(pos.productId));
            // console.log("Pozicie na poschodi: " + floor);
            // console.log(itemsOnFloorPositions);
            // vynechaj poschodie, ak neobsahuje polozky ktore ostava najst
            if (itemsLeftOnFloor.length === 0)
                continue;
            // vyber vsetky pozicie hladanych tovarov na poschodi a ich vzdialenosti od vozika
            ({ routeLengthItems, routeItems } = this.traceOneFloor(itemsLeftOnFloor, routeItems, routeLengthItems, startPosition, itemsOnFloorPositions));
            // ponechaj na hladanie na dalsom poschodi len tie produkty, ktore sa este nenasli na tomto poschodi
            itemsLeftOnFloor = itemsOnFloor.filter((item) => itemsLeft.includes(item));
            // ponechaj na celkove hladanie len tie produkty, ktore sa este nenasli na tomto poschodi
            itemsLeft = itemsLeft.filter((x) => !itemsLeftOnFloor.includes(x));
            // nastav vychodiskovu poziciu pre dalsie poschodie
            startPosition = { x: 0, y: 0, z: 0 };
        }
        // vyrataj celkovu prejdenu trasu
        routeLength = routeLengthItems.reduce(function (a, b) {
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
    traceOneFloor(itemsLeftOnFloor, routeItems, routeLengthItems, startPosition, floorPositions) {
        // zisti vsetky pozicie a ich vzdialenosti od aktualnej pozicie
        let allDistances = [];
        for (const position of floorPositions) {
            allDistances.push({
                productId: position.productId,
                positionId: position.positionId,
                x: position.x,
                y: position.y,
                z: position.z,
                distance: this.getDistance([startPosition.x, startPosition.y, startPosition.z], [position.x, position.y, position.z]),
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
        floorPositions = floorPositions.filter((item) => item.productId !== nearest.productId);
        // ak je este co hladat, chod hladat dalsi produkt
        if (itemsLeftOnFloor.length > 0) {
            this.traceOneFloor(itemsLeftOnFloor, routeItems, routeLengthItems, { x: nearest.x, y: nearest.y, z: nearest.z }, floorPositions);
        }
        return { routeLengthItems, routeItems };
    }
    /**
     * Get distance between two points
     * @param point1
     * @param point2
     * @returns
     */
    getDistance(point1, point2) {
        const [x1, y1, z1] = point1;
        const [x2, y2, z2] = point2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return dist;
    }
}
module.exports = new CalculateHelper();
