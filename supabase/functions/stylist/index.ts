import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, userId } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')

    console.log('API Key exists:', !!apiKey)
    console.log('Messages count:', messages?.length)
    console.log('userId:', userId)
    console.log('Auth header exists:', !!authHeader)

    // Загружаем профиль пользователя из БД
    let profile = null
    if (userId && supabaseUrl && supabaseAnonKey && authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data, error } = await supabaseClient
        .from('stylist_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (!error) profile = data
      console.log('Profile loaded:', !!profile)
    }

    const system = `Ты — Амина, персональный стилист магазина Capriccio. Общаешься на русском, тепло но по делу. Без лишних слов.

ДАННЫЕ КЛИЕНТА (уже известны — НИКОГДА не переспрашивай):
- Имя: ${profile?.name || 'не указано'}
- Размер одежды: ${profile?.clothing_size || 'не указан'}
- Рост: ${profile?.height ? profile.height + ' см' : 'не указан'}
- Вес: ${profile?.weight ? profile.weight + ' кг' : 'не указан'}
- Тип фигуры: ${profile?.body_type || 'не указан'}
- Цветотип: ${profile?.color_type || 'не указан'}
- Образ жизни: ${profile?.lifestyle || 'не указан'}
- Бюджет: ${profile?.budget_min || '?'} — ${profile?.budget_max || '?'} ₸
- Стиль: ${profile?.style_preferences?.join(', ') || 'не указан'}
- Город: ${profile?.city || 'не указан'}

ПРАВИЛА:
- Никогда не спрашивай параметры которые уже есть выше
- Максимум 1-2 уточняющих вопроса перед подборкой — объединяй их в одно сообщение
- После 2 сообщений клиента сразу показывай товары
- Отвечай коротко, конкретно, без воды
- Эмодзи использовать минимально

РАБОТА С КАТАЛОГОМ:
Когда рекомендуешь товары — добавь в конце ответа:
<products>{"search": "ключевые слова", "category": "категория"}</products>

Категории: Пуховики, Костюмы, Платья, Трикотаж, Обувь, Шапки, Сумки, Аксессуары

РАБОТА С ФОТО:
Если клиент прислал фото — оцени образ честно но тактично, предложи что улучшить.

СБОР ПРОФИЛЯ:
Если узнала новые данные — добавь в конце:
<profile>{"field": "название_поля", "value": "значение"}</profile>
Поля: name, age, height, weight, clothing_size, body_type, color_type, chest, waist, hips, budget_min, budget_max, notes, style_preferences (массив строк)`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages,
      }),
    })

    const data = await response.json()
    console.log('Anthropic status:', response.status)

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.log('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
