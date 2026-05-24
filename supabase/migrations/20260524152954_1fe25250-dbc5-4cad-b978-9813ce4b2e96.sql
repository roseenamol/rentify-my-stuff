
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  city text,
  area text,
  pincode text,
  is_verified boolean not null default false,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  sort_order int not null default 0
);
alter table public.categories enable row level security;
create policy "Categories are viewable by everyone" on public.categories for select using (true);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  unique(category_id, slug)
);
alter table public.subcategories enable row level security;
create policy "Subcategories are viewable by everyone" on public.subcategories for select using (true);

-- Products
create type public.listing_type as enum ('rent', 'sale', 'both');
create type public.product_status as enum ('active', 'unavailable', 'rented', 'sold', 'deleted');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  title text not null,
  description text,
  images text[] not null default '{}',
  condition text,
  listing_type public.listing_type not null default 'rent',
  rent_price_hour numeric(10,2),
  rent_price_day numeric(10,2),
  rent_price_week numeric(10,2),
  sale_price numeric(10,2),
  deposit numeric(10,2) not null default 0,
  city text,
  area text,
  pincode text,
  delivery_available boolean not null default false,
  status public.product_status not null default 'active',
  rating numeric(3,2) not null default 0,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Active products are viewable by everyone" on public.products for select using (status <> 'deleted');
create policy "Owners can insert products" on public.products for insert with check (auth.uid() = owner_id);
create policy "Owners can update own products" on public.products for update using (auth.uid() = owner_id);
create policy "Owners can delete own products" on public.products for delete using (auth.uid() = owner_id);

create index products_search_idx on public.products using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
create index products_city_idx on public.products(city);
create index products_pincode_idx on public.products(pincode);
create index products_category_idx on public.products(category_id);

-- Rentals
create type public.rental_status as enum ('pending','accepted','rejected','out_for_delivery','delivered','in_use','return_scheduled','returned','cancelled');

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  renter_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  total_amount numeric(10,2) not null,
  deposit numeric(10,2) not null default 0,
  delivery_option text not null default 'pickup',
  delivery_address text,
  status public.rental_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.rentals enable row level security;
create policy "Renter or owner can view rental" on public.rentals for select using (auth.uid() = renter_id or auth.uid() = owner_id);
create policy "Renter creates rental" on public.rentals for insert with check (auth.uid() = renter_id);
create policy "Renter or owner can update rental" on public.rentals for update using (auth.uid() = renter_id or auth.uid() = owner_id);

-- Orders (purchases)
create type public.order_status as enum ('pending','accepted','rejected','packed','out_for_delivery','delivered','cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  delivery_option text not null default 'pickup',
  delivery_address text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Buyer or owner can view order" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = owner_id);
create policy "Buyer creates order" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "Buyer or owner can update order" on public.orders for update using (auth.uid() = buyer_id or auth.uid() = owner_id);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
create policy "Authenticated users can post reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "Reviewers can update own review" on public.reviews for update using (auth.uid() = reviewer_id);

-- Wishlist
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.wishlists enable row level security;
create policy "Users see own wishlist" on public.wishlists for select using (auth.uid() = user_id);
create policy "Users add to own wishlist" on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Users delete from own wishlist" on public.wishlists for delete using (auth.uid() = user_id);

-- Seed categories
insert into public.categories (name, slug, icon, sort_order) values
('Electronics','electronics','Smartphone',1),
('Fashion','fashion','Shirt',2),
('Gaming','gaming','Gamepad2',3),
('Tools','tools','Wrench',4),
('Vehicles','vehicles','Car',5),
('Books','books','BookOpen',6),
('Cameras','cameras','Camera',7),
('Home Appliances','home-appliances','Home',8),
('Event Items','event-items','PartyPopper',9);

insert into public.subcategories (category_id, name, slug)
select c.id, s.name, s.slug from public.categories c
join (values
  ('electronics','Laptops','laptops'),('electronics','Smartphones','smartphones'),('electronics','TVs','tvs'),('electronics','Tablets','tablets'),('electronics','Speakers','speakers'),('electronics','Smartwatches','smartwatches'),('electronics','Projectors','projectors'),('electronics','Monitors','monitors'),
  ('fashion','Wedding Dresses','wedding-dresses'),('fashion','Traditional Dresses','traditional-dresses'),('fashion','Party Wear','party-wear'),('fashion','Sarees','sarees'),('fashion','Suits & Blazers','suits-blazers'),('fashion','Jewelry','jewelry'),('fashion','Handbags','handbags'),('fashion','Footwear','footwear'),
  ('gaming','PS5','ps5'),('gaming','Xbox','xbox'),('gaming','Gaming PCs','gaming-pcs'),('gaming','VR Headsets','vr-headsets'),('gaming','Racing Wheels','racing-wheels'),('gaming','Game CDs','game-cds'),
  ('tools','Drilling Machines','drilling-machines'),('tools','Welding Machines','welding-machines'),('tools','Gardening Tools','gardening-tools'),('tools','Power Tools','power-tools'),('tools','Tool Kits','tool-kits'),
  ('vehicles','Bikes','bikes'),('vehicles','Scooters','scooters'),('vehicles','Cars','cars'),('vehicles','Electric Cycles','electric-cycles'),
  ('books','Engineering Books','engineering-books'),('books','Entrance Exam Books','entrance-exam-books'),('books','School Books','school-books'),('books','Story Books','story-books'),
  ('cameras','DSLR','dslr'),('cameras','Mirrorless','mirrorless'),('cameras','Action Cameras','action-cameras'),('cameras','Lenses','lenses'),
  ('home-appliances','Washing Machines','washing-machines'),('home-appliances','Refrigerators','refrigerators'),('home-appliances','Microwaves','microwaves'),('home-appliances','Air Conditioners','air-conditioners'),
  ('event-items','Tents','tents'),('event-items','Sound Systems','sound-systems'),('event-items','Lights','lights'),('event-items','Furniture','furniture')
) as s(cat_slug, name, slug) on s.cat_slug = c.slug;
