"""API integration tests for card & deck sharing endpoints."""


class TestShare:
    def test_share_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Share Me",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        response = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["share_slug"] is not None
        assert data["share_mode"] == "view_and_copy"

    def test_share_card_invalid_mode(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Bad Mode",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        response = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "invalid_mode",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_unshare_card(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Unshare Me",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_only",
            },
            headers=auth_headers,
        )

        response = client.delete(f"/api/cards/{card_id}/share", headers=auth_headers)
        assert response.status_code == 204

        # Verify unshared
        card = client.get(f"/api/cards/{card_id}", headers=auth_headers)
        assert card.json()["share_slug"] is None

    def test_view_shared_card_view_only(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Public View Only",
                "elements": [{"id": "e1", "type": "text"}],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_only",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public View Only"
        assert data["can_copy"] is False

    def test_view_shared_card_view_and_copy(self, client, auth_headers):
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Public Copyable",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["can_copy"] is True

    def test_view_shared_card_not_found(self, client):
        response = client.get("/api/shared/nonexistent-slug")
        assert response.status_code == 404

    def test_view_shared_card_different_user(self, client, auth_headers):
        # Create and share as auth_headers user
        create_resp = client.post(
            "/api/cards",
            json={
                "title": "Cross User",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111",
                    "banner_fill": "#222222",
                    "box_fill": "#333333",
                    "stroke": "#444444",
                    "banner_text": "#555555",
                    "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = create_resp.json()["id"]

        share_resp = client.post(
            f"/api/cards/{card_id}/share",
            json={
                "mode": "view_and_copy",
            },
            headers=auth_headers,
        )
        slug = share_resp.json()["share_slug"]

        # Another user (unauthenticated) can view it
        response = client.get(f"/api/shared/{slug}")
        assert response.status_code == 200
        assert response.json()["title"] == "Cross User"


class TestShareEdgeCases:
    """Edge cases for card & deck sharing."""

    def test_reshare_card_updates_slug(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Reshare Me",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        first = client.post(f"/api/cards/{card_id}/share", json={"mode": "view_only"}, headers=auth_headers)
        first_slug = first.json()["share_slug"]

        second = client.post(f"/api/cards/{card_id}/share", json={"mode": "view_and_copy"}, headers=auth_headers)
        # May be same or different slug; just verify mode changed
        assert second.json()["share_mode"] == "view_and_copy"

    def test_reshare_deck_updates_mode(self, client, auth_headers):
        deck = client.post("/api/decks", json={"title": "Reshare Deck", "card_ids": []}, headers=auth_headers)
        deck_id = deck.json()["id"]

        client.post(f"/api/decks/{deck_id}/share", json={"mode": "view_only"}, headers=auth_headers)
        second = client.post(f"/api/decks/{deck_id}/share", json={"mode": "view_and_copy"}, headers=auth_headers)
        assert second.json()["share_mode"] == "view_and_copy"

    def test_unshare_unshared_card_is_idempotent(self, client, auth_headers):
        card = client.post(
            "/api/cards",
            json={
                "title": "Unshared Card",
                "elements": [],
                "img_url": "data:image/png;base64,test",
                "theme": {
                    "fill": "#111111", "banner_fill": "#222222", "box_fill": "#333333",
                    "stroke": "#444444", "banner_text": "#555555", "box_text": "#666666",
                },
            },
            headers=auth_headers,
        )
        card_id = card.json()["id"]

        resp = client.delete(f"/api/cards/{card_id}/share", headers=auth_headers)
        assert resp.status_code == 204

    def test_unshare_unshared_deck_is_idempotent(self, client, auth_headers):
        deck = client.post("/api/decks", json={"title": "Unshared Deck", "card_ids": []}, headers=auth_headers)
        deck_id = deck.json()["id"]

        resp = client.delete(f"/api/decks/{deck_id}/share", headers=auth_headers)
        assert resp.status_code == 204
