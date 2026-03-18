# Code Citations

## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-
```


## License: MIT
https://github.com/irfnd/fe-stafflab/blob/f1fabea34710a99164c21118c7707af08263b1b7/supabase/functions/cuti/index.ts

```


Achei a causa raiz. O seu **webhook do Stripe** só salva `subscription_status: "active"` — não salva os IDs. Por isso todos os usuários existentes estão sem `stripe_customer_id` e `stripe_subscription_id`.

Aqui está o código corrigido para deployar no lugar do atual. A mudança está no bloco `checkout.session.completed` / `invoice.paid`:

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing secrets" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const session: any = event.data.object;
      const email = session?.customer_details?.email || session?.metadata?.email;
      if (!email) throw new Error("No email in session");

      // ─── Dados completos para salvar ───────────────────────
      const updateData: Record<string, any> = {
        subscription_status: "active",
        cancel_at_period_end: false,
      };

      // Salvar IDs do Stripe (customer + subscription)
      if (session.customer) {
        updateData.stripe_customer_id = session.customer;
      }
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;

        // Buscar detalhes da subscription para detectar o plano
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "";
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;

          if (interval === "month" && intervalCount === 6) {
            updateData.current_plan = "Semestral";
          } else if (interval === "month") {
            updateData.current_plan = "Mensal";
          } else if (interval === "year") {
            updateData.current_plan = "Anual";
          }
        } catch (_) {
          // Se falhar, tenta usar metadata
          if (session.metadata?.plan_name) {
            updateData.current_plan = session.metadata.plan_name;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("email", email);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
```

