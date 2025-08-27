import { PrismaClient as ImProcurementProd } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmProd } from './prisma/clients/scm-prod';
import { PrismaClient as ScmOrderProd } from './prisma/clients/scm-order-prod';
import { PrismaClient as ImInventoryProd } from './prisma/clients/im-inventory-prod';

export class DatabaseService {
  imProcurementProd: ImProcurementProd;
  scmProd: ScmProd;
  scmOrderProd: ScmOrderProd;
  imInventoryProd: ImInventoryProd;

  constructor() {
    this.imProcurementProd = new ImProcurementProd();
    this.scmProd = new ScmProd();
    this.scmOrderProd = new ScmOrderProd();
    this.imInventoryProd = new ImInventoryProd();
  }

  async connect() {
    await Promise.all([
      this.imProcurementProd.$connect(),
      this.scmProd.$connect(),
      this.scmOrderProd.$connect(),
      this.imInventoryProd.$connect(),
    ]);
  }

  async disconnect() {
    await Promise.all([
      this.imProcurementProd.$disconnect(),
      this.scmProd.$disconnect(),
      this.scmOrderProd.$disconnect(),
      this.imInventoryProd.$disconnect(),
    ]);
  }

  async getImProcurementProd() {
    return this.imProcurementProd;
  }
}
