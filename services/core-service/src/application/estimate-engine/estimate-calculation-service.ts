import {DomainError} from "../../domain/errors.js";
export type NormConsumption={materialId:string;measurementUnitId:string;quantity:string;wastePercent:string;unitPrice:string;priceListId:string};
export type CalculatedMaterial=NormConsumption&{quantity:string;totalPrice:string};
const money=(v:number)=>v.toFixed(4),quantity=(v:number)=>v.toFixed(6);
export class EstimateCalculationService{
 calculate(workQuantity:string,rows:NormConsumption[]):CalculatedMaterial[]{return rows.map(x=>{const q=Number(workQuantity)*Number(x.quantity)*(1+Number(x.wastePercent)/100);if(!Number.isFinite(q)||q<=0)throw new DomainError("INVALID_RELATIONSHIP",422,"Norm consumption produced an invalid material quantity");return {...x,quantity:quantity(q),totalPrice:money(q*Number(x.unitPrice))};});}
 totals(laborCosts:string[],materialPrices:string[]){const totalLabor=laborCosts.reduce((s,x)=>s+Number(x),0),totalMaterials=materialPrices.reduce((s,x)=>s+Number(x),0);return {totalLabor:money(totalLabor),totalMaterials:money(totalMaterials),totalCost:money(totalLabor+totalMaterials)};}
}
