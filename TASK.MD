Context: We are building a payment initialization service using NestJS and MySQL. The service wraps the Primer API to create client sessions.

The Goal: Implement a POST /payments/init endpoint that is idempotent and transactionally safe.

Functional Requirements:

- Database Entity: Define a Payment entity with at least:

	* orderId (Unique String)
	* status (Enum: PENDING, COMPLETED, FAILED)
	* amount & currency
	* token (The ID returned from Primer)

- The Flow:

	* Validate the incoming payload (Amount, Currency).
	* Save to DB: Create a record with status PENDING.
	* Call Primer API: Request a new client session.
	* Update DB: If successful, update the record to COMPLETED and store the Primer token/ID.
	* Return: The client token to the user.

- Extra:

	* If a request arrives with an orderId that already exists in the database:
		* If COMPLETED: Return the stored token immediately (do not call Primer).
		* If PENDING: Handle the race condition (either block, throw error, or return "Processing").
	* Error Handling:
		* If the Primer API call fails, the database record must be updated to FAILED.


Sandbox api key:
 * <SANDBOX_API_KEY>


Tech Stack:

	* NestJS + TypeScript.
	* TypeORM
	* Docker (preferred for DB setup).

What we look for:

	* Atomicity: How you handle failures between the DB and the External API.
	* Clean Architecture: Usage of DTOs, Services, and Repositories.
	* Testability: At least one integration test demonstrating the idempotency logic.

Please aim to spend 3-4 hours on this. We value quality and architectural decisions over feature completeness.

Reply with your GitHub link when ready!