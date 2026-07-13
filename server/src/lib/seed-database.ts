import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { PaymentMethodKey } from '../data';
import type { SeedData } from '../seed';

export async function seedDatabase(prisma: PrismaClient, seeds: SeedData) {
  await prisma.$transaction(async (tx) => {
    for (const user of seeds.users) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          totalSpend: user.totalSpend,
        },
        create: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          totalSpend: user.totalSpend,
        },
      });
    }

    for (const venue of seeds.venues) {
      await tx.venue.upsert({
        where: { id: venue.id },
        update: {
          name: venue.name,
          city: venue.city,
          country: venue.country,
          district: venue.district,
          description: venue.description,
          category: venue.category,
          imageUrl: venue.imageUrl,
        },
        create: {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          country: venue.country,
          district: venue.district,
          description: venue.description,
          category: venue.category,
          imageUrl: venue.imageUrl,
        },
      });
    }

    for (const event of seeds.events) {
      await tx.event.upsert({
        where: { id: event.id },
        update: {
          organizerId: event.organizerId,
          venueId: event.venueId,
          title: event.title,
          date: event.date,
          location: event.location,
          category: event.category,
          price: event.price,
          description: event.description,
          organizer: event.organizer,
          color: event.color,
          imageUrl: event.imageUrl,
          status: event.status,
          coverImageUrl: event.coverImageUrl,
          venueMapUrl: event.venueMapUrl,
          publishedAt: event.status === 'published' ? new Date('2026-06-01T09:00:00.000Z') : null,
        },
        create: {
          id: event.id,
          organizerId: event.organizerId,
          venueId: event.venueId,
          title: event.title,
          date: event.date,
          location: event.location,
          category: event.category,
          price: event.price,
          description: event.description,
          organizer: event.organizer,
          color: event.color,
          imageUrl: event.imageUrl,
          status: event.status,
          coverImageUrl: event.coverImageUrl,
          venueMapUrl: event.venueMapUrl,
          publishedAt: event.status === 'published' ? new Date('2026-06-01T09:00:00.000Z') : null,
        },
      });

      await tx.eventGalleryImage.deleteMany({ where: { eventId: event.id } });
      if (event.galleryImageUrls.length > 0) {
        await tx.eventGalleryImage.createMany({
          data: event.galleryImageUrls.map((url, index) => ({
            id: `gallery_${event.id}_${index + 1}`,
            eventId: event.id,
            url,
            sortOrder: index,
          })),
        });
      }

      await tx.eventLineupItem.deleteMany({ where: { eventId: event.id } });
      if (event.lineup.length > 0) {
        await tx.eventLineupItem.createMany({
          data: event.lineup.map((item, index) => ({
            id: `lineup_${event.id}_${index + 1}`,
            eventId: event.id,
            time: item.time,
            title: item.title,
            stage: item.stage,
          })),
        });
      }
    }

    await tx.eventTier.deleteMany();
    if (seeds.eventTiers.length > 0) {
      await tx.eventTier.createMany({
        data: seeds.eventTiers.map((tier) => ({
          id: tier.id,
          eventId: tier.eventId,
          key: tier.key,
          name: tier.name,
          priceLabel: tier.priceLabel,
          priceCents: tier.priceCents,
          inventoryTotal: tier.inventoryTotal,
          inventorySold: tier.inventorySold,
          maxPerOrder: tier.maxPerOrder,
          waitlistEnabled: tier.waitlistEnabled,
          perks: JSON.stringify(tier.perks),
        })),
      });
    }

    await tx.promoCode.deleteMany();
    if (seeds.promoCodes.length > 0) {
      await tx.promoCode.createMany({
        data: seeds.promoCodes.map((promo) => ({
          id: promo.id,
          eventId: promo.eventId,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          maxUses: promo.maxUses,
          usedCount: promo.usedCount,
          active: promo.active,
          tierKey: promo.tierKey,
        })),
      });
    }

    for (const account of seeds.merchantAccounts) {
      await tx.merchantAccount.upsert({
        where: {
          organizerId_provider: {
            organizerId: account.organizerId,
            provider: account.provider as PaymentMethodKey,
          },
        },
        update: {
          businessName: account.businessName,
          supportEmail: account.supportEmail,
          country: account.country,
          city: account.city,
          phoneNumber: account.phoneNumber,
          payoutDetails: account.payoutDetails,
          status: account.status,
        },
        create: {
          id: randomUUID(),
          organizerId: account.organizerId,
          provider: account.provider as PaymentMethodKey,
          businessName: account.businessName,
          supportEmail: account.supportEmail,
          country: account.country,
          city: account.city,
          phoneNumber: account.phoneNumber,
          payoutDetails: account.payoutDetails,
          status: account.status,
        },
      });
    }

    for (const ticket of seeds.tickets) {
      const holderName = seeds.users.find((user) => user.id === ticket.userId)?.name ?? 'YoTicks';
      await tx.ticket.upsert({
        where: { id: ticket.id },
        update: {
          userId: ticket.userId,
          eventId: ticket.eventId,
          seat: ticket.seat,
          code: ticket.code,
          status: ticket.status,
          holderName,
          gate: ticket.gate,
          tierKey: ticket.tierKey ?? 'standard',
          pricePaid: ticket.pricePaid ?? 0,
        },
        create: {
          id: ticket.id,
          userId: ticket.userId,
          eventId: ticket.eventId,
          seat: ticket.seat,
          code: ticket.code,
          status: ticket.status,
          holderName,
          gate: ticket.gate,
          tierKey: ticket.tierKey ?? 'standard',
          pricePaid: ticket.pricePaid ?? 0,
        },
      });
    }

    for (const provider of seeds.providerUsers) {
      await tx.providerUser.upsert({
        where: { phone: provider.phone },
        update: {
          name: provider.name,
          city: provider.city,
          commune: provider.commune,
          lat: provider.lat,
          lng: provider.lng,
        },
        create: {
          phone: provider.phone,
          name: provider.name,
          city: provider.city,
          commune: provider.commune,
          lat: provider.lat,
          lng: provider.lng,
        },
      });
    }

    for (const session of seeds.checkoutSessions) {
      await tx.checkoutSession.upsert({
        where: { id: session.id },
        update: {
          userId: session.userId,
          eventId: session.eventId,
          organizerId: session.organizerId,
          tier: session.tier,
          paymentMethod: session.paymentMethod,
          amount: session.amount,
          status: session.status,
          createdAt: session.createdAt,
        },
        create: {
          id: session.id,
          userId: session.userId,
          eventId: session.eventId,
          organizerId: session.organizerId,
          tier: session.tier,
          paymentMethod: session.paymentMethod,
          amount: session.amount,
          status: session.status,
          createdAt: session.createdAt,
        },
      });
    }

    await tx.notification.deleteMany();
    if (seeds.notifications.length > 0) {
      await tx.notification.createMany({
        data: seeds.notifications.map((notification) => ({
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          dataUrl: notification.dataUrl,
          dataJson: notification.dataJson,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        })),
      });
    }

    await tx.searchHistory.deleteMany();
    if (seeds.searchHistory.length > 0) {
      await tx.searchHistory.createMany({
        data: seeds.searchHistory,
      });
    }

    await tx.followedOrganizer.deleteMany();
    if (seeds.followedOrganizers.length > 0) {
      await tx.followedOrganizer.createMany({
        data: seeds.followedOrganizers,
      });
    }

    await tx.followedCategory.deleteMany();
    if (seeds.followedCategories.length > 0) {
      await tx.followedCategory.createMany({
        data: seeds.followedCategories,
      });
    }

    await tx.eventInteraction.deleteMany();
    if (seeds.eventInteractions.length > 0) {
      await tx.eventInteraction.createMany({
        data: seeds.eventInteractions,
      });
    }

    await tx.waitlistEntry.deleteMany();
    if (seeds.waitlistEntries.length > 0) {
      await tx.waitlistEntry.createMany({
        data: seeds.waitlistEntries,
      });
    }
  });
}
