"use server";
import { database as db } from "@/db";
import { hash } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { lucia } from "@/db";
import { redirect } from "next/navigation";
import { generateIdFromEntropySize } from "lucia";
import { ActionResult } from "next/dist/server/app-render/types";
import { userTable } from "@/db/schema";

export type formState={
	message:string,
	error:boolean,
	errorPass:boolean
}
export async function signup(prevState:formState,formData: FormData): Promise<ActionResult> {
	const username = formData.get("username") ;
	// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
	// keep in mind some database (e.g. mysql) are case insensitive
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		console.log('error1')
		return {
			message:"Invalid username",
			error: true,
			errorPass:false
		};
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		console.log('error2')
		return {
			message:"Invalid password",
			error:false,
			errorPass:true
		};
	}
	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	const userId = generateIdFromEntropySize(10); // 16 characters long

	// TODO: check if username is already used
	await db.insert(userTable).values({
		id: userId,
		username: username,
		password_hash: passwordHash
	});
	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return{
			message:"success",
			error:false
		}

}