/**
 * Exportar todos los servicios desde un solo lugar
 * Uso: import { productService, saleService } from '../api';
 */

import productService from './productService';
import saleService from './saleService';
import userService from './userService';
import reportService from './reportService';
import dashboardService from './dashboardService';
import inventoryService from './inventoryService';
import systemService from './systemService';

export {
  productService,
  saleService,
  userService,
  reportService,
  dashboardService,
  inventoryService,
  systemService
};

// También exportar como objeto por defecto
export default {
  products: productService,
  sales: saleService,
  users: userService,
  reports: reportService,
  dashboard: dashboardService,
  inventory: inventoryService,
  system: systemService
};
