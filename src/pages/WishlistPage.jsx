import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] rounded-lg bg-gray-200" />
          <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
          <div className="mt-4 h-10 w-full rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

export default function WishlistPage() {
  const addItem = useCartStore((state) => state.addItem)

  const [user, setUser] = useState(null)
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function loadWishlist() {
      setLoading(true)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser || null)
      setAuthChecked(true)

      if (!currentUser) {
        setWishlistItems([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', currentUser.id)

      setWishlistItems(data || [])
      setLoading(false)
    }

    loadWishlist()
  }, [])

  async function handleRemove(productId) {
    if (!user) return

    await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    setWishlistItems((current) => current.filter((item) => item.product_id !== productId))
  }

  function handleAddToCart(product) {
    if (!product) return

    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.images?.[0],
      quantity: 1,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <AccountSidebarMobile />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <AccountSidebarDesktop />
          <div>
            {loading ? (
              <WishlistSkeleton />
            ) : authChecked && !user ? (
              <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
                <Heart className="mx-auto h-10 w-10 text-gray-300" />
                <h1 className="mt-5 text-2xl font-bold text-gray-900">Избранное</h1>
                <p className="mt-3 text-sm text-gray-500">Войдите чтобы сохранять избранное</p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex h-12 items-center rounded bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  Войти
                </Link>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
                <Heart className="mx-auto h-10 w-10 text-gray-300" />
                <h1 className="mt-5 text-2xl font-bold text-gray-900">Избранное</h1>
                <p className="mt-3 text-sm text-gray-500">Вы ещё ничего не добавили в избранное</p>
                <Link
                  to="/catalog"
                  className="mt-6 inline-flex h-12 items-center rounded bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
                  <p className="mt-1 text-sm text-gray-500">Ваши сохранённые модели Capriccio</p>
                </div>
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                  {wishlistItems.map((item) => {
                    const product = item.products
                    const price = product?.sale_price || product?.price
                    const originalPrice = product?.sale_price ? product.price : null
                    const image = product?.images?.[0] || `https://picsum.photos/seed/${item.product_id}/600/800`

                    if (!product) return null

                    return (
                      <div key={item.id || item.product_id} className="group">
                        <Link to={`/product/${product.id}`} className="block">
                          <div className="relative overflow-hidden rounded-lg bg-gray-50">
                            <img
                              src={image}
                              alt={product.name}
                              className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault()
                                handleRemove(product.id)
                              }}
                              aria-label="Удалить из избранного"
                              className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-gray-700 shadow-sm transition-colors hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <h2 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                            {product.name}
                          </h2>

                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {Number(price || 0).toLocaleString('ru-RU')} ₸
                            </span>
                            {originalPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {Number(originalPrice).toLocaleString('ru-RU')} ₸
                              </span>
                            )}
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded bg-gray-900 text-xs tracking-wide text-white transition-colors hover:bg-gray-700"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          В корзину
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
