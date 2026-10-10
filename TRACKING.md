# Tracking plan — Woodward Sports Network

GA4 property **G-256WQGQSLH** (gtag.js, installed in the site code) · GTM container **GTM-MB6LV6QX**.
Every event below is sent to **GA4 directly** and also pushed to GTM's **`dataLayer`** (for future tools such as a Meta Pixel).
Code: `components/client/Analytics.tsx` (events) and `data-*` attributes in the components.

> Don't add a GA4 tag inside GTM. GA4 already receives these events from the site, so a GTM GA4 tag would count everything twice.

## Goals → events

| Business question | Events |
|---|---|
| Which shows pull an audience, and where do people go next (watch / listen)? | `show_view`, `show_open`, `show_click`, `show_surf`, `watch_open`, `listen_*` |
| Which socials do visitors follow, and from where on the site? | `social_click` |
| How much exposure can each sponsor placement sell, and does it convert? | `sponsor_slot_view`, `sponsor_slot_click`, `advertise_contact` |
| Commerce and app | `shop_click`, `app_store`, `youtube_member` |
| Teams and stories | `team_view`, `team_click`, `story_click`, `youtube_click` |

## Events

### Shows
| Event | Fires when | Parameters |
|---|---|---|
| `show_view` | A show page loads (`/shows/<show>`), including client-side navigation | `show_id` |
| `show_open` | The show sheet opens (Day Rail / lineup rows on the home page) | `show_id`, `placement` |
| `show_surf` | The visitor pages to the next/previous show in the sheet (arrows, keys or swipe) | `show_id` (the new show), `direction` (`next`/`prev`) |
| `show_click` | A link to a show page is clicked anywhere | `show_id`, `placement` |
| `watch_open` | Watch Live, the hero player, the dock WATCH button, a show's Watch button or a video card opens the Live Room | `placement` (`facade`, `dock`, `show`, …), `video_id`, `show_id` when known |
| `listen_apple`, `listen_spotify`, `listen_rss` | A podcast link is clicked | `show_id`, `placement` |

### Social
| Event | Fires when | Parameters |
|---|---|---|
| `social_click` | A link to a WSN social profile is clicked | `platform` (`instagram`, `facebook`, `x`, `tiktok`, `youtube`), `placement` (`footer`, `advertise_section`, …) |

### Sponsor placements
Every sponsor slot carries `data-slot="<placement>[:<subject>]"`:

| `slot_id` | Where |
|---|---|
| `ticker` | "This spot is available" item in the headline ticker (every page) |
| `live_room` | "Live Room presented by" in the player |
| `show_sheet:<show>` | "<Show> presented by" in the show sheet |
| `show_page:<show>` | Partner slot on each show page |
| `team_hub:<team>` | Partner slot on each team page |
| `watch_party_partner` | Presenting partner on the home page and on /watch-parties |
| `advertise_demo` | The looping "Presented by — your brand" demo player (view only) |
| `advertise_list:<slot>` | The list of open slots on /advertise |

| Event | Fires when | Parameters |
|---|---|---|
| `sponsor_slot_view` | A slot is at least 50% visible for 1 second. Counted once per slot per page view; a slot that switches show in place (show sheet paging) counts again. | `slot_id`, `slot_placement`, `show_id` / `team_id`, `placement` |
| `sponsor_slot_click` | A slot is clicked (all go to /advertise) | same + `label` |
| `advertise_contact` | The "Advertise with WSN" CTA is clicked | `method` (`instagram_dm` / `messenger`), `placement` (`advertise_section`, `advertise_hero`) |

### Other
| Event | Fires when | Parameters |
|---|---|---|
| `team_view` | A team page loads | `team_id` |
| `team_click` | A link to a team page is clicked | `team_id`, `placement` |
| `story_click` | A story link (woodwardsports.com) is clicked | `placement`, `team_id` when on a team page |
| `shop_click` | A Shopify link is clicked | `placement`, `show_id`/`team_id` when known |
| `app_store` | The WSN Live! App Store link is clicked | `placement` |
| `youtube_click` | A YouTube video link is clicked (outside the Live Room) | `video_id`, `placement` |
| `youtube_member` | The channel membership link is clicked | `placement` |

Common to all events: `page_path`; click events also send `label` (button text) and `link_url` where relevant.
GA4 also records its own automatic events (`page_view` including client-side navigation, `scroll`, outbound `click`, `user_engagement`).

**IDs**
- `show_id`: `big-d-energy`, `crunch-time`, `braylon-edwards-show`, `woodward-heavyweights`
- `team_id`: `lions`, `pistons`, `tigers`, `red-wings`, `michigan`, `michigan-state`

## Setup in GA4 (one time, about 5 minutes)

1. **Admin → Custom definitions → Create custom dimension** (scope **Event**). Create one per parameter, with the same name as the event parameter:
   `show_id`, `team_id`, `placement`, `slot_id`, `slot_placement`, `platform`, `method`, `direction`, `video_id`, `label`.
   Without this, the parameters are collected but don't appear in reports.
2. **Admin → Events → mark as Key event**: `advertise_contact`, `sponsor_slot_click`, `shop_click`, `listen_apple`, `listen_spotify`, `app_store`.
   The events appear in this list after they first fire, which can take up to 24 h.
3. Reports to build in **Explore**:
   - **Sponsor inventory**: rows `slot_id`, values Event count for `sponsor_slot_view` and `sponsor_slot_click`. That gives impressions and CTR per placement.
   - **Show funnel**: `show_view` / `show_open` → `watch_open` / `listen_*`, broken down by `show_id`.
   - **Social**: `social_click` by `platform` × `placement`.

## Setup in GTM (only for non-GA4 tools)
Optional. All events are in the `dataLayer` with the same names and parameters:
- **Variables**: Data Layer Variables for the parameters above.
- **Trigger**: Custom Event, regex `show_.*|watch_open|listen_.*|social_click|sponsor_slot_.*|advertise_contact|shop_click|app_store|team_.*|story_click|youtube_.*`.
- Use them for e.g. a Meta Pixel. Again: no GA4 tag in GTM.

## Testing
- GA4 → Admin → **DebugView**, or **Reports → Realtime → Event count by Event name**.
- GTM → **Preview**: events appear in the left column with their dataLayer values.
