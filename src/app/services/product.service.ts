import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { CreateNewProductFormData, Product } from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

export type GetAllProductsResponse = {
  items: Product[]
}

export type GetProductResponse = {
  item: Product
}

export type CreateNewProductResponse = {
  item: Product
}

@Service()
export class ProductService {
  httpClient = inject(HttpClient)
  
  getAllProducts = () => {
    return lastValueFrom(this.httpClient.get<GetAllProductsResponse>('/products/search'))
  }

  getProductById = (product_id: string | undefined) => {
    return lastValueFrom(this.httpClient.get<GetProductResponse>(`/products/${product_id}`))
  }

  createNewProduct = (formData: CreateNewProductFormData) => {
    return lastValueFrom(this.httpClient.post<CreateNewProductResponse>("/products", formData))
  }
}
