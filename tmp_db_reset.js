const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mockCampaigns = [
    {
        month: 1,
        month_name: 'Jan',
        subject: '🎉 Een Gezond Begin bij Café Het Paardje',
        summary: 'Nieuwe lunchkaart vol gezonde opties en speciale groepsreserveringen in januari.',
        bodyText: `Lieve gasten,

We heten je van harte welkom in januari bij Café Het Paardje! 

Hopelijk zien we jullie snel weer op ons terras of gezellig binnen aan de bar voor een koud biertje en de fameuze bitterballen.

Tot dan!

Liefs,
Team Het Paardje`,
        image_url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80',
        send_date: 'Jan 27th',
        status: 'sent'
    },
    {
        month: 2,
        month_name: 'Feb',
        subject: '❤️ Liefde & Gezelligheid: Valentine bij Het Paardje',
        summary: 'Vier de liefde met ons speciale Valentine\'s diner. Reserveer op tijd!',
        bodyText: `Beste gasten,

We heten je van harte welkom deze maand! Bereid je voor op een maand vol liefde met ons speciale Valentine diner.

Hopelijk zien we jullie snel!

Liefs,
Team Het Paardje`,
        image_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
        send_date: 'Feb 27th',
        status: 'scheduled'
    }
];

async function seed() {
    console.log("Fetching users...");
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
    if (userErr) return console.error("Error fetching users:", userErr.message);

    const user = users.users[0];
    if (!user) return console.error('No users found to seed campaigns for');

    for (const c of mockCampaigns) {
        console.log(`Inserting month ${c.month}...`);
        const { error } = await supabase.from('campaigns').upsert({
            user_id: user.id,
            month: c.month,
            month_name: c.month_name,
            subject: c.subject,
            summary: c.summary,
            bodyText: c.bodyText,
            image_url: c.image_url,
            send_date: c.send_date,
            status: c.status
        }, { onConflict: 'user_id, month' }); // Let's just insert. Wait, no conflict defined on user_id, month.
        if (error) {
            // Fallback to strict insert
            await supabase.from('campaigns').insert({ ...c, user_id: user.id });
        }
    }
    console.log('Seeding complete.');
}
seed();
