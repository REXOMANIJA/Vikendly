# Photo credits

All photos below are from [Unsplash](https://unsplash.com) and used under the
[Unsplash License](https://unsplash.com/license) (free for commercial use, no attribution required).
The license was checked on each photo's Unsplash page before use.

## Homepage and categories (files in `public/images/`)

These show a *type* of house, not a listed house or a specific place.

| Where on the site | File | Unsplash page |
|---|---|---|
| Homepage hero: A-frame weekend house with a fire pit | `hero-weekend-house.jpg` | https://unsplash.com/photos/AZDyU1hXtCE |
| Category: Planinska kuća | `categories/mountain.jpg` | https://unsplash.com/photos/sxbm8vYTKHA |
| Category: Kuća za žurke | `categories/party.jpg` | https://unsplash.com/photos/ZxDX8D9HHNM |
| Category: Kuća na vodi | `categories/lake.jpg` | https://unsplash.com/photos/zAjdgNXsMeg |
| Category: Kuća sa bazenom | `categories/pool.jpg` | https://unsplash.com/photos/mR1CIDduGLc |
| Category: Porodična kuća | `categories/family.jpg` | https://unsplash.com/photos/178j8tJrNlc |
| Category: Apartman | `categories/apartment.jpg` | https://unsplash.com/photos/iYQT6PNToYo |

## Destinations (stored in Supabase Storage, bucket `house-photos`, folder `destinacije/`)

Each location was checked on the photo's Unsplash page. Replace any of them in the admin under **Destinacije**.

| Destination | Location (as listed on Unsplash) | Unsplash page |
|---|---|---|
| Zlatibor | Zlatibor, Serbia | https://unsplash.com/photos/ZkQpudKd7lo |
| Kopaonik | Kopaonik, Serbia | https://unsplash.com/photos/BqrZVCRTyJM |
| Tara | Tara, Mokra Gora, Serbia | https://unsplash.com/photos/qt5_EpbCzWo |
| Divčibare | Divčibare, Serbia | https://unsplash.com/photos/lZ7oQs561Ls |
| Fruška Gora | Sremski Karlovci, Serbia | https://unsplash.com/photos/FdSyNKGkV70 |
| Drina | Kućica na Drini, Višesava, Serbia | https://unsplash.com/photos/Bogi1deEzec |
| Durmitor | Durmitor National Park, Žabljak, Montenegro | https://unsplash.com/photos/24gpYnCoUpk |
| Jahorina | Jahorina, Bosnia and Herzegovina | https://unsplash.com/photos/LGMkiyzJon0 |

Not a photo: the Vlasina destination is an illustration (`public/images/destination-vlasina.svg`),
because no free photo of Vlasina was available.

House photos must always be real photos of the house, supplied by the owner.

## Demo houses (files in `public/images/demo/`, migration `0018_demo_houses.sql`)

Five example listings to show future owners how a house page looks. They are **not real places**;
the photos are free Unsplash photos (checked "Free Photo" on each page, 16 Nov 2026). Delete the
houses and this folder once real houses replace them (the delete command is at the top of 0018).

| House | Files | Unsplash pages |
|---|---|---|
| Brvnara Jelova Kosa (Zlatibor) | `zlatibor-1…4.jpg` | tm1qqeuhbLE, D-IPwXyS9J4, DNt5A4T0-Rs, rP0OTFdVaak |
| Apartman Sunčani vrh (Kopaonik) | `kopaonik-1…3.jpg` | gB7Pk-j-Pg0, qis-hFSFILQ, r3dQ0K3nDzg |
| Kuća među vinogradima (Fruška Gora) | `fruska-1…4.jpg` | zpuIXbRXEfE, WHwu_Pzo37s, gbplWlQZMco, eyqzXh5unoc |
| Vila sa bazenom Ripanj (Beograd) | `avala-1…5.jpg` | 04AR3aq4NfE, LFTBo4Hu44E, qlE_rpH3_1c, kzX1Vv6-Wgk, IoGqOxDrCvg |
| Brvnara na obali Drine (Drina) | `drina-1…4.jpg` | GEtyMJ4ffN8, 24ijoyY0Hrs, Uoh1UV2cAEs, JCIMLvIrZJI |

Each page is `https://unsplash.com/photos/<code>`.

### More demo houses (migration `0019_more_demo_houses.sql`, checked "Free Photo" 16 Nov 2026)

| House | Files | Unsplash pages |
|---|---|---|
| A-frame Maljen (Divčibare) | `divcibare-1…4.jpg` | DS2rtg-Nbgk, oIx5RmkC9Ow, XPnYrngQNx0, Mll-2jMQXpA |
| Kuća na Vlasinskom jezeru (Vlasina) | `vlasina-1…3.jpg` | Lp5GGwnqwTM, nZdFqEaAI0w, vHSpG5kgUVE |
| Planinska vila Jahorina (Jahorina) | `jahorina-1…4.jpg` | BTQWx51keUY, ZxsCUanD3Io, QvT33bwGnIM, zVwBT5i2SoE |
| Seoska kuća Šargan (Mokra Gora) | `mokragora-1…3.jpg` | kj1R2T69jhQ, FPhpVpwUviA, qTZGn2Sk_Us |
| Brvnara pod Durmitorom (Durmitor) | `durmitor-1…4.jpg` | qkJhJOefs-Y, 6pR1UB6ihsQ, vxjVQqhiKNA, xUhzoprik7k |

## Partner houses (files in `public/images/houses/<house>/`, migration `0020_partner_houses.sql`)

Real houses listed with their owners' permission (16 Nov 2026). Photos are the owners' own,
taken from each property's Booking.com page (15 per house, 01 = cover): Brvnara Miris Bora,
Brvnara Tarski proplanak, Konak kod Munje, Dobrila apartmani, Zlatiborski katuni.
